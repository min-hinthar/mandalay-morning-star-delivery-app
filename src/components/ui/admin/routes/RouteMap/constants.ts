import type { RouteStopStatus } from "@/types/driver";

export const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -30 }, { lightness: 10 }],
  },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d4e4ed" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ lightness: 50 }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f5e6c8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c8e6c9" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export const STATUS_COLORS: Record<RouteStopStatus, string> = {
  pending: "#3B82F6",
  enroute: "#F59E0B",
  arrived: "#F59E0B",
  delivered: "#22C55E",
  skipped: "#6B7280",
};

export const EXCEPTION_COLOR = "#EF4444";
export const SAFFRON = "#D4A017";

export const containerStyle = { width: "100%", height: "100%" };
export const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
