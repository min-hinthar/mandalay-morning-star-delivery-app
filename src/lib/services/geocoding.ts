import {
  type CoverageFailureReason,
  type GeocodingResult,
} from "@/types/address";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface GoogleGeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
  }>;
  status: string;
  error_message?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY");
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set("components", "country:US|administrative_area:CA");

    const response = await fetch(url.toString());
    const data: GoogleGeocodingResponse = await response.json();

    if (data.status !== "OK" || data.results.length === 0) {
      console.error("Geocoding failed:", data.status, data.error_message);
      return {
        formattedAddress: "",
        lat: 0,
        lng: 0,
        isValid: false,
        reason: "GEOCODE_FAILED",
      };
    }

    const result = data.results[0];

    const isStreetLevel = result.types.some(
      (type) => type === "street_address" || type === "premise" || type === "subpremise"
    );

    if (!isStreetLevel) {
      const hasStreetNumber = /^\d+/.test(result.formatted_address);
      if (!hasStreetNumber) {
        console.warn("Address not specific enough:", result.formatted_address);
        return {
          formattedAddress: "",
          lat: 0,
          lng: 0,
          isValid: false,
          reason: "INVALID_ADDRESS",
        };
      }
    }

    return {
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      isValid: true,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return {
      formattedAddress: "",
      lat: 0,
      lng: 0,
      isValid: false,
      reason: "GEOCODE_FAILED",
    };
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY");
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data: GoogleGeocodingResponse = await response.json();

    if (data.status !== "OK" || data.results.length === 0) {
      return null;
    }

    return data.results[0].formatted_address;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
