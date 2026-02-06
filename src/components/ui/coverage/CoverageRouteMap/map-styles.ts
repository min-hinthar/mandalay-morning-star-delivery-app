export const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -20 }, { lightness: 5 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9dde8" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f0e8" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 40 }, { saturation: -50 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#fde8d0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e8d4b8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d4e8d4" }],
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
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b5b4d" }],
  },
];

export const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
