import { geocodeAddress } from "@/lib/services/geocoding";
import {
  COVERAGE_LIMITS,
  CoverageCheckResult,
  CoverageFailureReason,
  KITCHEN_LOCATION,
} from "@/types/address";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface GoogleRoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: {
      encodedPolyline?: string;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

function parseDuration(duration?: string): number {
  if (!duration) {
    return 0;
  }

  const numeric = duration.replace(/\D/g, "");
  const seconds = Number.parseInt(numeric, 10);
  return Number.isNaN(seconds) ? 0 : seconds;
}

export async function checkCoverage(
  destLat: number,
  destLng: number
): Promise<CoverageCheckResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY");
  }

  try {
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

    const body = {
      origin: {
        location: {
          latLng: {
            latitude: KITCHEN_LOCATION.lat,
            longitude: KITCHEN_LOCATION.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destLat,
            longitude: destLng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      computeAlternativeRoutes: false,
      languageCode: "en-US",
      units: "IMPERIAL",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify(body),
    });

    const data: GoogleRoutesResponse = await response.json();

    if (!response.ok || data.error || !data.routes || data.routes.length === 0) {
      console.error("Routes API error:", data.error);
      return {
        isValid: false,
        distanceMiles: 0,
        durationMinutes: 0,
        reason: "ROUTE_FAILED",
        lat: destLat,
        lng: destLng,
      };
    }

    const route = data.routes[0];
    const distanceMeters = route.distanceMeters ?? 0;
    const durationSeconds = parseDuration(route.duration);

    const distanceMiles = distanceMeters / 1609.34;
    const durationMinutes = durationSeconds / 60;

    const distanceValid = distanceMiles <= COVERAGE_LIMITS.maxDistanceMiles;
    const durationValid = durationMinutes <= COVERAGE_LIMITS.maxDurationMinutes;

    let reason: CoverageFailureReason | undefined;
    if (!distanceValid) {
      reason = "DISTANCE_EXCEEDED";
    } else if (!durationValid) {
      reason = "DURATION_EXCEEDED";
    }

    return {
      isValid: distanceValid && durationValid,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
      reason,
      lat: destLat,
      lng: destLng,
    };
  } catch (error) {
    console.error("Coverage check error:", error);
    return {
      isValid: false,
      distanceMiles: 0,
      durationMinutes: 0,
      reason: "ROUTE_FAILED",
      lat: destLat,
      lng: destLng,
    };
  }
}

export async function checkAddressCoverage(
  address: string
): Promise<CoverageCheckResult> {
  const geocode = await geocodeAddress(address);

  if (!geocode.isValid) {
    return {
      isValid: false,
      distanceMiles: 0,
      durationMinutes: 0,
      reason: geocode.reason ?? "GEOCODE_FAILED",
    };
  }

  const coverage = await checkCoverage(geocode.lat, geocode.lng);

  return {
    ...coverage,
    formattedAddress: geocode.formattedAddress,
    lat: geocode.lat,
    lng: geocode.lng,
  };
}
