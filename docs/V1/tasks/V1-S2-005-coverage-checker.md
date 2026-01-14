# Task: V1-S2-005 — Coverage Checker

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: V0 Environment Setup
> **Branch**: `feat/coverage-checker`

---

## Objective

Implement the delivery coverage validation system using Google Maps Platform APIs. The system must validate that delivery addresses are within 50 miles and 90 minutes drive time from the kitchen (Covina, CA). This is critical for ensuring deliverable orders and is called during address creation and at checkout.

---

## Acceptance Criteria

- [ ] Google Geocoding API converts addresses to coordinates
- [ ] Google Routes API calculates distance and duration
- [ ] Coverage check validates: distance ≤ 50 miles AND duration ≤ 90 minutes
- [ ] Clear error messages for out-of-coverage scenarios
- [ ] API route for manual coverage checks
- [ ] Service functions for server-side use
- [ ] Coverage result includes distance, duration, and failure reason
- [ ] Environment variables configured for Google Maps
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Coverage Types

Add to `src/types/address.ts`:

```typescript
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
}

export type CoverageFailureReason =
  | 'DISTANCE_EXCEEDED'
  | 'DURATION_EXCEEDED'
  | 'GEOCODE_FAILED'
  | 'ROUTE_FAILED'
  | 'INVALID_ADDRESS';

// Coverage constants
export const KITCHEN_LOCATION = {
  lat: 34.0858,
  lng: -117.8896,
  address: '750 Terrado Plaza, Suite 33, Covina, CA 91723',
} as const;

export const COVERAGE_LIMITS = {
  maxDistanceMiles: 50,
  maxDurationMinutes: 90,
} as const;
```

### 2. Geocoding Service

Create `src/lib/services/geocoding.ts`:

```typescript
import type { GeocodingResult } from '@/types/address';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

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
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
    // Bias results to California
    url.searchParams.set('components', 'country:US|administrative_area:CA');

    const response = await fetch(url.toString());
    const data: GoogleGeocodingResponse = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      console.error('Geocoding failed:', data.status, data.error_message);
      return { formattedAddress: '', lat: 0, lng: 0, isValid: false };
    }

    const result = data.results[0];

    // Verify it's a street-level address (not just city or state)
    const isStreetLevel = result.types.some(
      (t) => t === 'street_address' || t === 'premise' || t === 'subpremise'
    );

    if (!isStreetLevel) {
      // Accept rooftop-level results too
      const hasStreetNumber = /^\d+/.test(result.formatted_address);
      if (!hasStreetNumber) {
        console.warn('Address not specific enough:', result.formatted_address);
        return { formattedAddress: '', lat: 0, lng: 0, isValid: false };
      }
    }

    return {
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      isValid: true,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { formattedAddress: '', lat: 0, lng: 0, isValid: false };
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data: GoogleGeocodingResponse = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      return null;
    }

    return data.results[0].formatted_address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
```

### 3. Coverage Service

Create `src/lib/services/coverage.ts`:

```typescript
import {
  KITCHEN_LOCATION,
  COVERAGE_LIMITS,
  type CoverageCheckResult,
} from '@/types/address';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

interface GoogleRoutesResponse {
  routes: Array<{
    distanceMeters: number;
    duration: string; // e.g., "3600s"
    polyline: {
      encodedPolyline: string;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

export async function checkCoverage(
  destLat: number,
  destLng: number
): Promise<CoverageCheckResult> {
  try {
    // Use Google Routes API (newer, recommended over Distance Matrix)
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

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
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE', // Use standard routing for consistency
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'IMPERIAL',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify(body),
    });

    const data: GoogleRoutesResponse = await response.json();

    if (data.error || !data.routes || data.routes.length === 0) {
      console.error('Routes API error:', data.error);
      return {
        isValid: false,
        distanceMiles: 0,
        durationMinutes: 0,
        reason: 'ROUTE_FAILED',
      };
    }

    const route = data.routes[0];
    const distanceMeters = route.distanceMeters;
    const durationSeconds = parseInt(route.duration.replace('s', ''), 10);

    const distanceMiles = distanceMeters / 1609.34;
    const durationMinutes = durationSeconds / 60;

    // Check both constraints
    const distanceValid = distanceMiles <= COVERAGE_LIMITS.maxDistanceMiles;
    const durationValid = durationMinutes <= COVERAGE_LIMITS.maxDurationMinutes;

    let reason: CoverageCheckResult['reason'];
    if (!distanceValid) {
      reason = 'DISTANCE_EXCEEDED';
    } else if (!durationValid) {
      reason = 'DURATION_EXCEEDED';
    }

    return {
      isValid: distanceValid && durationValid,
      distanceMiles: Math.round(distanceMiles * 10) / 10, // 1 decimal
      durationMinutes: Math.round(durationMinutes),
      reason,
    };
  } catch (error) {
    console.error('Coverage check error:', error);
    return {
      isValid: false,
      distanceMiles: 0,
      durationMinutes: 0,
      reason: 'ROUTE_FAILED',
    };
  }
}

/**
 * Full coverage check with geocoding
 */
export async function checkAddressCoverage(
  address: string
): Promise<CoverageCheckResult> {
  const { geocodeAddress } = await import('./geocoding');

  const geocode = await geocodeAddress(address);

  if (!geocode.isValid) {
    return {
      isValid: false,
      distanceMiles: 0,
      durationMinutes: 0,
      reason: 'GEOCODE_FAILED',
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
```

### 4. Coverage API Route

Create `src/app/api/coverage/check/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkCoverage, checkAddressCoverage } from '@/lib/services/coverage';

const checkSchema = z.union([
  z.object({
    address: z.string().min(1),
  }),
  z.object({
    lat: z.number(),
    lng: z.number(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = checkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: result.error.issues } },
        { status: 400 }
      );
    }

    let coverage;

    if ('address' in result.data) {
      coverage = await checkAddressCoverage(result.data.address);
    } else {
      coverage = await checkCoverage(result.data.lat, result.data.lng);
    }

    return NextResponse.json({ data: coverage });
  } catch (error) {
    console.error('Coverage check error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Coverage check failed' } },
      { status: 500 }
    );
  }
}
```

### 5. Coverage Check Hook

Create `src/lib/hooks/useCoverageCheck.ts`:

```typescript
import { useMutation } from '@tanstack/react-query';
import type { CoverageCheckResult } from '@/types/address';

interface CheckCoverageParams {
  address?: string;
  lat?: number;
  lng?: number;
}

export function useCoverageCheck() {
  return useMutation<{ data: CoverageCheckResult }, Error, CheckCoverageParams>({
    mutationFn: async (params) => {
      const res = await fetch('/api/coverage/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Coverage check failed');
      }

      return res.json();
    },
  });
}
```

### 6. Coverage Display Component

Create `src/components/checkout/CoverageStatus.tsx`:

```typescript
'use client';

import { CheckCircle, XCircle, MapPin, Clock, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CoverageCheckResult } from '@/types/address';
import { cn } from '@/lib/utils/cn';
import { COVERAGE_LIMITS } from '@/types/address';

interface CoverageStatusProps {
  result: CoverageCheckResult;
  className?: string;
}

export function CoverageStatus({ result, className }: CoverageStatusProps) {
  if (result.isValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-start gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950/30',
          className
        )}
      >
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
        <div>
          <p className="font-medium text-green-800 dark:text-green-200">
            Delivery available!
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            {result.distanceMiles} miles · ~{result.durationMinutes} min drive
          </p>
        </div>
      </motion.div>
    );
  }

  const errorMessages: Record<string, string> = {
    DISTANCE_EXCEEDED: `This address is ${result.distanceMiles} miles away. We deliver within ${COVERAGE_LIMITS.maxDistanceMiles} miles.`,
    DURATION_EXCEEDED: `This address is ~${result.durationMinutes} minutes away. We deliver within ${COVERAGE_LIMITS.maxDurationMinutes} minutes drive time.`,
    GEOCODE_FAILED: 'We could not verify this address. Please check and try again.',
    ROUTE_FAILED: 'We could not calculate a route to this address.',
    INVALID_ADDRESS: 'Please enter a complete street address.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-950/30',
        className
      )}
    >
      <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
      <div>
        <p className="font-medium text-red-800 dark:text-red-200">
          Outside delivery area
        </p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          {errorMessages[result.reason || 'ROUTE_FAILED']}
        </p>
        {result.distanceMiles > 0 && (
          <div className="mt-2 flex gap-4 text-xs text-red-600 dark:text-red-400">
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {result.distanceMiles} mi
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{result.durationMinutes} min
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

### 7. Environment Variables

Add to `.env.local`:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

Ensure the API key has these APIs enabled:
- Geocoding API
- Routes API (or Distance Matrix API as fallback)

---

## Test Plan

### API Tests

```bash
# Check coverage by address
curl -X POST http://localhost:3000/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"address":"123 Main St, Covina, CA 91722"}'

# Check coverage by coordinates
curl -X POST http://localhost:3000/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"lat":34.0901,"lng":-117.8903}'

# Test out-of-coverage (San Francisco)
curl -X POST http://localhost:3000/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"address":"1 Market St, San Francisco, CA 94105"}'
```

### Unit Tests

```typescript
describe('Coverage Service', () => {
  it('approves address within coverage', async () => {
    const result = await checkAddressCoverage('100 N Citrus Ave, Covina, CA 91723');
    expect(result.isValid).toBe(true);
    expect(result.distanceMiles).toBeLessThan(5);
  });

  it('rejects address outside coverage - distance', async () => {
    const result = await checkAddressCoverage('1 Market St, San Francisco, CA 94105');
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('DISTANCE_EXCEEDED');
  });

  it('handles invalid address', async () => {
    const result = await checkAddressCoverage('asdfasdfasdf');
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('GEOCODE_FAILED');
  });
});
```

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Coverage types and constants defined
2. [ ] Geocoding service implemented
3. [ ] Coverage service with Routes API
4. [ ] POST /api/coverage/check works
5. [ ] Accepts both address string and coordinates
6. [ ] Returns distance, duration, validity
7. [ ] Clear failure reasons provided
8. [ ] useCoverageCheck hook created
9. [ ] CoverageStatus component displays results
10. [ ] Environment variables documented
11. [ ] Unit tests pass
12. [ ] `pnpm lint` passes
13. [ ] `pnpm typecheck` passes
14. [ ] `pnpm build` succeeds
15. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- **CRITICAL**: Both distance AND duration must pass for valid coverage
- Kitchen location: 750 Terrado Plaza, Suite 33, Covina, CA 91723
- Max distance: 50 miles, Max duration: 90 minutes
- Use Routes API (newer) over Distance Matrix (legacy)
- Cache geocoding results if needed (future optimization)
- Handle API quota limits gracefully
- Always validate server-side, never trust client coverage checks
- Bias geocoding to California to avoid incorrect matches

---

*Task ready for implementation*
