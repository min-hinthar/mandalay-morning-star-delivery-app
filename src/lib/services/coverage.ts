import { geocodeAddress } from "@/lib/services/geocoding";
import { logger } from "@/lib/utils/logger";
import {
  COVERAGE_LIMITS,
  CoverageCheckResult,
  CoverageFailureReason,
  KITCHEN_LOCATION,
} from "@/types/address";
import { getDirectionsForCoords, DEFAULT_ZONES } from "@/lib/utils/delivery-zones";
import { getBusinessRules } from "@/lib/settings/business-rules";

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
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify(body),
    });

    const data: GoogleRoutesResponse = await response.json();

    if (!response.ok || data.error || !data.routes || data.routes.length === 0) {
      logger.error("Routes API error", { api: "coverage" });
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

    const roundedMiles = Math.round(distanceMiles * 10) / 10;
    const isValid = distanceValid && durationValid;

    // Compute direction/fee info for valid addresses
    let directions: string[] | undefined;
    let eligibleDays: string[] | undefined;
    let feeTier: "standard" | "extended" | undefined;
    let estimatedFeeCents: number | undefined;

    if (isValid) {
      // Fetch live business rules from DB (cached 5 min) instead of hardcoded defaults
      const rules = await getBusinessRules();
      const zones = rules.deliveryZones.length > 0 ? rules.deliveryZones : DEFAULT_ZONES;

      // Build day-name map from actual delivery_days config
      const dayNameMap: Record<string, string[]> = {};
      const DAY_LABELS = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      for (const dd of rules.deliveryDays) {
        if (!dd.isActive) continue;
        const dir = dd.direction ?? "all";
        if (!dayNameMap[dir]) dayNameMap[dir] = [];
        dayNameMap[dir].push(DAY_LABELS[dd.dayOfWeek]);
      }

      const dirs = getDirectionsForCoords(destLat, destLng, zones);
      directions = dirs;

      // Collect eligible days: days matching customer direction + "all"-direction days
      const days: string[] = [];
      for (const d of dirs) {
        if (dayNameMap[d]) days.push(...dayNameMap[d]);
      }
      if (dayNameMap["all"]) days.push(...dayNameMap["all"]);
      // Fallback: if no delivery_days config, use legacy static mapping
      if (days.length === 0 && dirs.length > 0) {
        const LEGACY_DAY_NAMES: Record<string, string> = {
          east: "Monday",
          west: "Wednesday",
          south: "Thursday",
        };
        for (const d of dirs) {
          if (LEGACY_DAY_NAMES[d]) days.push(LEGACY_DAY_NAMES[d]);
        }
        days.push("Saturday");
      }
      eligibleDays = [...new Set(days)];

      const threshold = rules.longDistanceThresholdMiles;
      if (roundedMiles > threshold) {
        feeTier = "extended";
        estimatedFeeCents = rules.longDistanceFeeCents;
      } else {
        feeTier = "standard";
        estimatedFeeCents = rules.deliveryFeeCents;
      }
    }

    return {
      isValid,
      distanceMiles: roundedMiles,
      durationMinutes: Math.round(durationMinutes),
      reason,
      lat: destLat,
      lng: destLng,
      encodedPolyline: route.polyline?.encodedPolyline,
      directions,
      eligibleDays,
      feeTier,
      estimatedFeeCents,
    };
  } catch {
    logger.error("Coverage check error", { api: "coverage" });
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

export async function checkAddressCoverage(address: string): Promise<CoverageCheckResult> {
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
