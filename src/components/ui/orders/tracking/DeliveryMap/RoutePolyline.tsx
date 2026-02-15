"use client";

/**
 * RouteProgressLine - Route line with completed/remaining color split
 *
 * Renders two Polyline components:
 * - Completed portion (start to driver): jade green, solid
 * - Remaining portion (driver to destination): charcoal-300, dashed
 */

import { Polyline } from "@react-google-maps/api";

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteProgressLineProps {
  driverPosition: LatLng | null;
  destinationPosition: LatLng;
  restaurantPosition?: LatLng | null;
  routePolyline?: string | null;
}

export function RouteProgressLine({
  driverPosition,
  destinationPosition,
  restaurantPosition,
  routePolyline: _routePolyline,
}: RouteProgressLineProps) {
  // If no driver position (pre-delivery), show line from restaurant to destination
  if (!driverPosition) {
    if (!restaurantPosition) return null;
    return (
      <Polyline
        path={[restaurantPosition, destinationPosition]}
        options={{
          strokeColor: "#9CA3AF",
          strokeOpacity: 0.6,
          strokeWeight: 3,
          icons: [
            {
              icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
              offset: "0",
              repeat: "16px",
            },
          ],
        }}
      />
    );
  }

  // Completed portion: from start/restaurant to driver position
  const startPoint = restaurantPosition ?? driverPosition;
  const completedPath = [startPoint, driverPosition];

  // Remaining portion: from driver to destination
  const remainingPath = [driverPosition, destinationPosition];

  return (
    <>
      {/* Completed portion - jade green, solid */}
      <Polyline
        path={completedPath}
        options={{
          strokeColor: "#2E8B57",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        }}
      />
      {/* Remaining portion - charcoal-300, dashed */}
      <Polyline
        path={remainingPath}
        options={{
          strokeColor: "#9CA3AF",
          strokeOpacity: 0.7,
          strokeWeight: 4,
          icons: [
            {
              icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
              offset: "0",
              repeat: "16px",
            },
          ],
        }}
      />
    </>
  );
}
