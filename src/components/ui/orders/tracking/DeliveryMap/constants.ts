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
