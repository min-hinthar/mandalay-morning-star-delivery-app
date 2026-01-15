/**
 * Mock responses for Google Routes API
 * Used in coverage.test.ts
 */

export interface MockRoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

/**
 * Within coverage limits (40km = 24.8 miles, 60 min)
 */
export const withinCoverageResponse: MockRoutesResponse = {
  routes: [
    {
      distanceMeters: 40000, // ~24.8 miles
      duration: "3600s", // 60 minutes
    },
  ],
};

/**
 * Exceeds distance limit (90km = 55.9 miles, within duration)
 */
export const exceedsDistanceResponse: MockRoutesResponse = {
  routes: [
    {
      distanceMeters: 90000, // ~55.9 miles (exceeds 50 mile limit)
      duration: "3600s", // 60 minutes
    },
  ],
};

/**
 * Exceeds duration limit (within distance, 100 minutes)
 */
export const exceedsDurationResponse: MockRoutesResponse = {
  routes: [
    {
      distanceMeters: 40000, // ~24.8 miles
      duration: "6000s", // 100 minutes (exceeds 90 min limit)
    },
  ],
};

/**
 * At exact threshold (50 miles, 90 minutes)
 */
export const atThresholdResponse: MockRoutesResponse = {
  routes: [
    {
      distanceMeters: 80467, // Exactly 50 miles
      duration: "5400s", // Exactly 90 minutes
    },
  ],
};

/**
 * No routes found
 */
export const noRoutesResponse: MockRoutesResponse = {
  routes: [],
};

/**
 * API error response
 */
export const apiErrorResponse: MockRoutesResponse = {
  error: {
    code: 500,
    message: "Internal server error",
  },
};

/**
 * Create a custom response with specific distance and duration
 */
export function createRoutesResponse(
  distanceMiles: number,
  durationMinutes: number
): MockRoutesResponse {
  return {
    routes: [
      {
        distanceMeters: Math.round(distanceMiles * 1609.34),
        duration: `${Math.round(durationMinutes * 60)}s`,
      },
    ],
  };
}

/**
 * Mock fetch function for Google Routes API
 */
export function createGoogleRoutesFetchMock(response: MockRoutesResponse) {
  return vi.fn().mockResolvedValue({
    ok: !response.error,
    json: () => Promise.resolve(response),
  });
}
