const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

interface GeocodeResult {
  formatted_address: string;
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance_meters: number;
  duration_seconds: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    address,
    key: GOOGLE_MAPS_API_KEY ?? "",
  });

  const response = await fetch(`${GEOCODING_URL}?${params}`);
  const data: {
    status?: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  } = await response.json();

  if (data.status !== "OK" || !data.results?.[0]) {
    return null;
  }

  const result = data.results[0];
  return {
    formatted_address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  };
}

export async function getDistanceMatrix(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult | null> {
  const params = new URLSearchParams({
    origins: `${originLat},${originLng}`,
    destinations: `${destLat},${destLng}`,
    mode: "driving",
    key: GOOGLE_MAPS_API_KEY ?? "",
  });

  const response = await fetch(`${DISTANCE_MATRIX_URL}?${params}`);
  const data: {
    status?: string;
    rows?: Array<{
      elements?: Array<{
        status?: string;
        distance?: { value: number };
        duration?: { value: number };
      }>;
    }>;
  } = await response.json();

  if (data.status !== "OK") {
    return null;
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (element?.status !== "OK" || !element.distance || !element.duration) {
    return null;
  }

  return {
    distance_meters: element.distance.value,
    duration_seconds: element.duration.value,
  };
}

export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60);
}
