"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ============================================
// TYPES
// ============================================

export interface MapStop {
  id: string;
  lat: number;
  lng: number;
  label: string;
  clusterColor?: string;
}

interface RouteBuilderMapProps {
  stops: MapStop[];
  center?: [number, number];
  onStopClick?: (id: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

// Kitchen location: Covina, CA
const DEFAULT_CENTER: [number, number] = [34.0858, -117.8896];
const DEFAULT_ZOOM = 12;

// ============================================
// INNER COMPONENTS
// ============================================

/**
 * FitBounds: Adjusts map viewport when stops change.
 * Uses useMap() hook — must be rendered inside MapContainer.
 */
function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [stops, map]);

  return null;
}

/**
 * Creates a colored circle divIcon for a map stop.
 * Avoids marker image bundling issues entirely.
 */
function createStopIcon(color: string = "#0891b2"): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${color};
      border: 2.5px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

// ============================================
// COMPONENT
// ============================================

export function RouteBuilderMap({
  stops,
  center = DEFAULT_CENTER,
  onStopClick,
}: RouteBuilderMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full rounded-xl"
      style={{ minHeight: "400px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <FitBounds stops={stops} />

      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={createStopIcon(stop.clusterColor)}
          eventHandlers={
            onStopClick
              ? {
                  click: () => onStopClick(stop.id),
                }
              : undefined
          }
        >
          <Popup>{stop.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
