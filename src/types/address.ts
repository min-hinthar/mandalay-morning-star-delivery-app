export interface CoverageCheckRequest {
  address?: string;
  lat?: number;
  lng?: number;
}

export type CoverageFailureReason =
  | "DISTANCE_EXCEEDED"
  | "DURATION_EXCEEDED"
  | "GEOCODE_FAILED"
  | "ROUTE_FAILED"
  | "INVALID_ADDRESS";

export interface CoverageCheckResult {
  isValid: boolean;
  distanceMiles: number;
  durationMinutes: number;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  reason?: CoverageFailureReason;
}

export const KITCHEN_LOCATION = {
  lat: 34.0858,
  lng: -117.8896,
  address: "750 Terrado Plaza, Suite 33, Covina, CA 91723",
} as const;

export const COVERAGE_LIMITS = {
  maxDistanceMiles: 50,
  maxDurationMinutes: 90,
} as const;
