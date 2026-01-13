# Task: V0-005 — Coverage Check (API + UI)

> **Priority**: P1
> **Milestone**: V0 — Skeleton
> **Depends On**: V0-002 (Database Schema)
> **Branch**: `project-init`

---

## Objective

Implement the delivery coverage check feature using Google Maps APIs. Users enter their address, and the system determines if they're within the 50-mile / 90-minute delivery radius from the kitchen in Covina, CA.

---

## Acceptance Criteria

- [ ] `POST /api/coverage/check` endpoint functional
- [ ] Google Maps Geocoding validates and formats address
- [ ] Google Maps Distance Matrix calculates driving distance/time
- [ ] Addresses within 50mi AND 90min return `deliverable: true`
- [ ] Addresses outside limits return `deliverable: false` with reason
- [ ] Invalid addresses return appropriate error
- [ ] Coverage UI component on homepage
- [ ] Address input with submit button
- [ ] Clear result display (deliverable/not deliverable)
- [ ] Loading state during API call
- [ ] Error handling for API failures

---

## Technical Specification

### 1. Environment Variables

Ensure these are in `.env.local`:

```bash
# Google Maps (server-side only)
GOOGLE_MAPS_API_KEY=AIza...

# Kitchen origin coordinates (Covina, CA)
KITCHEN_LAT=34.0900
KITCHEN_LNG=-117.8903

# Coverage limits
MAX_DISTANCE_MILES=50
MAX_DURATION_MINUTES=90
```

### 2. Zod Schema

Create `src/lib/validators/coverage.ts`:

```typescript
import { z } from "zod";

export const CoverageCheckRequestSchema = z.object({
  address: z.string().min(5, "Please enter a valid address"),
});

export const CoverageCheckResponseSchema = z.object({
  deliverable: z.boolean(),
  distance_miles: z.number(),
  duration_minutes: z.number(),
  formatted_address: z.string(),
  reason: z.string().optional(),
});

export type CoverageCheckRequest = z.infer<typeof CoverageCheckRequestSchema>;
export type CoverageCheckResponse = z.infer<typeof CoverageCheckResponseSchema>;
```

### 3. Google Maps Client

Update `src/lib/maps/client.ts`:

```typescript
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
    key: GOOGLE_MAPS_API_KEY!,
  });

  const response = await fetch(`${GEOCODING_URL}?${params}`);
  const data = await response.json();

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
    key: GOOGLE_MAPS_API_KEY!,
  });

  const response = await fetch(`${DISTANCE_MATRIX_URL}?${params}`);
  const data = await response.json();

  if (data.status !== "OK") {
    return null;
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (element?.status !== "OK") {
    return null;
  }

  return {
    distance_meters: element.distance.value,
    duration_seconds: element.duration.value,
  };
}

// Conversion helpers
export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60);
}
```

### 4. Coverage Check API Route

Update `src/app/api/coverage/check/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { CoverageCheckRequestSchema } from "@/lib/validators/coverage";
import {
  geocodeAddress,
  getDistanceMatrix,
  metersToMiles,
  secondsToMinutes,
} from "@/lib/maps/client";

// Kitchen origin from env
const KITCHEN_LAT = parseFloat(process.env.KITCHEN_LAT || "34.0900");
const KITCHEN_LNG = parseFloat(process.env.KITCHEN_LNG || "-117.8903");
const MAX_DISTANCE_MILES = parseInt(process.env.MAX_DISTANCE_MILES || "50");
const MAX_DURATION_MINUTES = parseInt(process.env.MAX_DURATION_MINUTES || "90");

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const parsed = CoverageCheckRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { address } = parsed.data;

    // Geocode the address
    const geocoded = await geocodeAddress(address);
    if (!geocoded) {
      return NextResponse.json(
        { error: "Unable to find address. Please enter a valid address." },
        { status: 400 }
      );
    }

    // Calculate distance from kitchen
    const distance = await getDistanceMatrix(
      KITCHEN_LAT,
      KITCHEN_LNG,
      geocoded.lat,
      geocoded.lng
    );

    if (!distance) {
      return NextResponse.json(
        { error: "Unable to calculate distance. Please try again." },
        { status: 500 }
      );
    }

    const distanceMiles = Math.round(metersToMiles(distance.distance_meters) * 10) / 10;
    const durationMinutes = secondsToMinutes(distance.duration_seconds);

    // Check coverage
    const withinDistance = distanceMiles <= MAX_DISTANCE_MILES;
    const withinDuration = durationMinutes <= MAX_DURATION_MINUTES;
    const deliverable = withinDistance && withinDuration;

    // Build reason if not deliverable
    let reason: string | undefined;
    if (!deliverable) {
      if (!withinDistance && !withinDuration) {
        reason = `Address is ${distanceMiles} miles away (max ${MAX_DISTANCE_MILES}) and ${durationMinutes} min drive (max ${MAX_DURATION_MINUTES})`;
      } else if (!withinDistance) {
        reason = `Address is ${distanceMiles} miles away (max ${MAX_DISTANCE_MILES} miles)`;
      } else {
        reason = `Drive time is ${durationMinutes} minutes (max ${MAX_DURATION_MINUTES} minutes)`;
      }
    }

    return NextResponse.json({
      deliverable,
      distance_miles: distanceMiles,
      duration_minutes: durationMinutes,
      formatted_address: geocoded.formatted_address,
      reason,
    });
  } catch (error) {
    console.error("Coverage check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
```

### 5. Coverage Check UI Component

Create `src/components/coverage/coverage-check.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoverageCheckResponse } from "@/lib/validators/coverage";

export function CoverageCheck() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverageCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/coverage/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Failed to check coverage. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center font-display text-brand-red">
          Check Delivery Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted">
              We deliver within 50 miles of Covina, CA every Saturday
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold hover:bg-gold-dark text-foreground"
            disabled={loading || !address.trim()}
          >
            {loading ? "Checking..." : "Check Coverage"}
          </Button>
        </form>

        {/* Error State */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result State */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-md border ${
              result.deliverable
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            {result.deliverable ? (
              <>
                <p className="font-medium text-green-700">
                  Great news! We deliver to your area.
                </p>
                <p className="mt-1 text-sm text-green-600">
                  {result.formatted_address}
                </p>
                <p className="mt-2 text-xs text-green-600">
                  {result.distance_miles} miles · {result.duration_minutes} min drive
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-700">
                  Sorry, we don&apos;t deliver to this address yet.
                </p>
                <p className="mt-1 text-sm text-amber-600">
                  {result.formatted_address}
                </p>
                {result.reason && (
                  <p className="mt-2 text-xs text-amber-600">{result.reason}</p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 6. Update Homepage

Update `src/app/(public)/page.tsx`:

```typescript
import Image from "next/image";
import { CoverageCheck } from "@/components/coverage/coverage-check";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <Image
          src="/logo.png"
          alt="Mandalay Morning Star"
          width={160}
          height={160}
          priority
          className="mb-6"
        />
        <h1 className="text-3xl md:text-4xl font-display text-brand-red text-center">
          Mandalay Morning Star
        </h1>
        <p className="mt-3 text-muted text-center max-w-md">
          Authentic Burmese cuisine delivered fresh to your door every Saturday.
        </p>
      </section>

      {/* Coverage Check Section */}
      <section className="flex justify-center px-4 pb-12">
        <CoverageCheck />
      </section>

      {/* Info Section */}
      <section className="bg-brand-red/5 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-display text-brand-red mb-4">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div>
              <div className="text-3xl mb-2">1</div>
              <p className="font-medium">Check Coverage</p>
              <p className="text-muted">Enter your address above</p>
            </div>
            <div>
              <div className="text-3xl mb-2">2</div>
              <p className="font-medium">Order by Friday 3PM</p>
              <p className="text-muted">Browse our menu and checkout</p>
            </div>
            <div>
              <div className="text-3xl mb-2">3</div>
              <p className="font-medium">Saturday Delivery</p>
              <p className="text-muted">Fresh food, 11am - 7pm</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
```

### 7. Export Component

Create `src/components/coverage/index.ts`:

```typescript
export { CoverageCheck } from "./coverage-check";
```

---

## Test Plan

### API Testing

```bash
# Valid address within coverage
curl -X POST http://localhost:3000/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, Los Angeles, CA 90012"}'

# Expected: deliverable: true (LA is ~30 miles from Covina)

# Address outside coverage
curl -X POST http://localhost:3000/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, San Diego, CA 92101"}'

# Expected: deliverable: false (San Diego is ~100 miles)

# Invalid address
curl -X POST http://localhost:3000/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"address": "asdfghjkl"}'

# Expected: error message
```

### Manual UI Testing

1. Go to homepage
2. Enter "1234 S Atlantic Blvd, Alhambra, CA" → Should be deliverable
3. Enter "123 Broadway, San Diego, CA" → Should NOT be deliverable
4. Enter "invalid address xyz" → Should show error
5. Test loading state appears during check
6. Test on mobile viewport

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Coverage check API endpoint functional
2. [ ] Geocoding validates addresses correctly
3. [ ] Distance Matrix calculates driving distance
4. [ ] 50mi AND 90min rule enforced
5. [ ] Clear deliverable/not deliverable response
6. [ ] Error handling for invalid addresses
7. [ ] Coverage UI component on homepage
8. [ ] Loading state during API call
9. [ ] Mobile responsive design
10. [ ] `pnpm lint` passes
11. [ ] `pnpm typecheck` passes
12. [ ] `pnpm build` succeeds
13. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Google Maps API key must have Geocoding + Distance Matrix APIs enabled
- Kitchen coordinates default to Covina, CA (34.0900, -117.8903)
- Both distance AND duration must pass for deliverable
- Round distance to 1 decimal place for display
- The component is self-contained with local state (no global store needed)

---

*Task created: 2026-01-12 | Ready for implementation*
