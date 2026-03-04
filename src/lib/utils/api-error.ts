import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "STRIPE_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST";

export function apiError(code: ApiErrorCode, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

/** Extract human-readable message from API error response.
 *  Handles both old flat format and new structured format for backward compat. */
export function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.error === "string") return d.error;
  if (d.error && typeof d.error === "object") {
    const err = d.error as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;
  }
  return fallback;
}
