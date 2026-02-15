/**
 * DeliveryMap Constants
 *
 * Map styles, container config, and libraries configuration.
 */

// Custom map styles for warm aesthetic (consistent with CoverageMap)
export const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -30 }, { lightness: 10 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#d4e4ed" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 50 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f5e6c8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#c8e6c9" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
];

export const containerStyle = {
  width: "100%",
  height: "100%",
};

// Libraries must match other map components
export const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

// Check if Map ID is available for AdvancedMarkerElement
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

// ---- Marker sizes ----
export const MARKER_SIZES = {
  restaurant: { width: 40, height: 48 },
  vehicle: { width: 36, height: 36 },
  destination: { width: 40, height: 48 },
} as const;

// ---- Animation ----
export const MARKER_ANIMATION_DURATION_MS = 1000;
export const MARKER_ANIMATION_FRAMES = 60;

// ---- Stale location threshold (2 minutes) ----
export const STALE_LOCATION_THRESHOLD_MS = 2 * 60 * 1000;

// ---- Auto-fit threshold (lat/lng delta) ----
export const AUTO_FIT_THRESHOLD = 0.001;
