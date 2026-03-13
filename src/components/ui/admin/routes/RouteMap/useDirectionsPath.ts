"use client";

import { useState, useEffect, useRef } from "react";

interface UseDirectionsPathParams {
  isLoaded: boolean;
  hasEncodedPolyline: boolean;
  origin: google.maps.LatLngLiteral;
  stops: { lat: number; lng: number }[];
}

interface DirectionsResult {
  path: google.maps.LatLngLiteral[];
  isEstimated: boolean;
}

/** Max intermediates per Directions request (Google limit: 25 total = origin + dest + 23) */
const MAX_INTERMEDIATES = 23;

/** Hash stop coords for cache key */
function hashStops(stops: { lat: number; lng: number }[]): string {
  return stops.map((s) => `${s.lat.toFixed(6)},${s.lng.toFixed(6)}`).join("|");
}

/**
 * Fetches driving directions via Google Maps DirectionsService when no
 * encoded polyline is available. Returns road-following path segments.
 */
export function useDirectionsPath({
  isLoaded,
  hasEncodedPolyline,
  origin,
  stops,
}: UseDirectionsPathParams): DirectionsResult {
  const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [isEstimated, setIsEstimated] = useState(false);
  const cacheKeyRef = useRef<string>("");
  const serviceRef = useRef<google.maps.DirectionsService | null>(null);

  useEffect(() => {
    if (!isLoaded || hasEncodedPolyline || stops.length === 0) {
      setPath([]);
      setIsEstimated(false);
      return;
    }

    const key = hashStops(stops);
    if (key === cacheKeyRef.current) return;

    if (!serviceRef.current) {
      serviceRef.current = new google.maps.DirectionsService();
    }
    const service = serviceRef.current;

    let cancelled = false;

    async function fetchDirections() {
      try {
        // Chunk stops if > MAX_INTERMEDIATES
        const allPoints = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
        const chunks: google.maps.LatLngLiteral[][] = [];

        if (allPoints.length <= MAX_INTERMEDIATES + 1) {
          chunks.push(allPoints);
        } else {
          // Split into chunks, each chunk overlaps at boundary (last point = next origin)
          for (let i = 0; i < allPoints.length; i += MAX_INTERMEDIATES) {
            const end = Math.min(i + MAX_INTERMEDIATES + 1, allPoints.length);
            chunks.push(allPoints.slice(i, end));
          }
        }

        const combinedPath: google.maps.LatLngLiteral[] = [];

        for (let c = 0; c < chunks.length; c++) {
          if (cancelled) return;

          const chunk = chunks[c];
          const chunkOrigin = c === 0 ? origin : chunk[0];
          const chunkDest = chunk[chunk.length - 1];
          const intermediates = c === 0 ? chunk.slice(0, -1) : chunk.slice(1, -1);

          const waypoints = intermediates.map((pt) => ({
            location: new google.maps.LatLng(pt.lat, pt.lng),
            stopover: true,
          }));

          const result = await new Promise<google.maps.DirectionsResult | null>(
            (resolve, reject) => {
              service.route(
                {
                  origin: chunkOrigin,
                  destination: chunkDest,
                  waypoints,
                  travelMode: google.maps.TravelMode.DRIVING,
                  optimizeWaypoints: false,
                },
                (res, status) => {
                  if (status === google.maps.DirectionsStatus.OK && res) {
                    resolve(res);
                  } else if (status === google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                    reject(new Error("OVER_QUERY_LIMIT"));
                  } else {
                    resolve(null);
                  }
                }
              );
            }
          );

          if (!result?.routes?.[0]) continue;

          const route = result.routes[0];
          for (const leg of route.legs) {
            for (const step of leg.steps) {
              for (const pt of step.path) {
                combinedPath.push({ lat: pt.lat(), lng: pt.lng() });
              }
            }
          }
        }

        if (!cancelled && combinedPath.length > 0) {
          cacheKeyRef.current = key;
          setPath(combinedPath);
          setIsEstimated(true);
        }
      } catch {
        // On error, return empty path → component falls through to straight-line
        if (!cancelled) {
          setPath([]);
          setIsEstimated(false);
        }
      }
    }

    fetchDirections();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, hasEncodedPolyline, origin, stops]);

  return { path, isEstimated };
}
