export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  distanceMiles?: number | null;
}

export interface AddressFormData {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface GeocodingResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  isValid: boolean;
  reason?: CoverageFailureReason;
}

export interface CoverageResult {
  isValid: boolean;
  distanceMiles: number;
  durationMinutes: number;
  reason?: CoverageFailureReason;
  encodedPolyline?: string;
}

export type CoverageFailureReason =
  | "DISTANCE_EXCEEDED"
  | "DURATION_EXCEEDED"
  | "GEOCODE_FAILED"
  | "ROUTE_FAILED"
  | "INVALID_ADDRESS";

export interface CoverageCheckRequest {
  address?: string;
  lat?: number;
  lng?: number;
}

export interface CoverageCheckResult {
  isValid: boolean;
  distanceMiles: number;
  durationMinutes: number;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  reason?: CoverageFailureReason;
  encodedPolyline?: string;
  directions?: string[];
  eligibleDays?: string[];
  feeTier?: "standard" | "extended";
  estimatedFeeCents?: number;
}

export const ADDRESS_LABELS = ["Home", "Work", "Other"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

export { KITCHEN_COORDS as KITCHEN_LOCATION } from "@/lib/constants/kitchen";

export const COVERAGE_LIMITS = {
  maxDistanceMiles: 50,
  maxDurationMinutes: 90,
} as const;
