"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Circle,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import { MapPin, Navigation, Clock, Ruler } from "lucide-react";

// Custom map styles for warm Burmese aesthetic
const mapStyles: google.maps.MapTypeStyle[] = [
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

interface UserLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface RouteInfo {
  distanceMiles: number;
  durationMinutes: number;
}

interface CoverageMapProps {
  userLocation?: UserLocation;
  routeInfo?: RouteInfo;
  showRoute?: boolean;
  onMapLoad?: () => void;
  className?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Convert miles to meters for the circle radius
const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;

export function CoverageMap({
  userLocation,
  routeInfo,
  showRoute = false,
  onMapLoad,
  className = "",
}: CoverageMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showKitchenInfo, setShowKitchenInfo] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [, setIsAnimatingRoute] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // Center point - either between kitchen and user, or just kitchen
  const center = useMemo(() => {
    if (userLocation) {
      return {
        lat: (KITCHEN_LOCATION.lat + userLocation.lat) / 2,
        lng: (KITCHEN_LOCATION.lng + userLocation.lng) / 2,
      };
    }
    return { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };
  }, [userLocation]);

  // Calculate appropriate zoom level
  const zoom = useMemo(() => {
    if (!userLocation) return 10;
    // Calculate distance and adjust zoom
    const latDiff = Math.abs(KITCHEN_LOCATION.lat - userLocation.lat);
    const lngDiff = Math.abs(KITCHEN_LOCATION.lng - userLocation.lng);
    const maxDiff = Math.max(latDiff, lngDiff);
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 9;
    if (maxDiff > 0.2) return 10;
    return 11;
  }, [userLocation]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      onMapLoad?.();
    },
    [onMapLoad]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Generate route path when user location changes
  useEffect(() => {
    if (userLocation && showRoute) {
      // Simple straight line for now - can be enhanced with Directions API
      const steps = 50;
      const path: google.maps.LatLngLiteral[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        path.push({
          lat: KITCHEN_LOCATION.lat + t * (userLocation.lat - KITCHEN_LOCATION.lat),
          lng: KITCHEN_LOCATION.lng + t * (userLocation.lng - KITCHEN_LOCATION.lng),
        });
      }
      setRoutePath([]);
      setIsAnimatingRoute(true);

      // Animate route drawing
      let currentIndex = 0;
      const animationInterval = setInterval(() => {
        currentIndex += 2;
        if (currentIndex >= path.length) {
          setRoutePath(path);
          setIsAnimatingRoute(false);
          clearInterval(animationInterval);
        } else {
          setRoutePath(path.slice(0, currentIndex));
        }
      }, 40);

      return () => clearInterval(animationInterval);
    } else {
      setRoutePath([]);
    }
  }, [userLocation, showRoute]);

  // Fit bounds when user location is provided
  useEffect(() => {
    if (map && userLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(KITCHEN_LOCATION);
      bounds.extend(userLocation);
      map.fitBounds(bounds, 80);
    }
  }, [map, userLocation]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-cream ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-brand-red mx-auto mb-3" />
          <p className="text-muted-foreground">Unable to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-cream ${className}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-6"
        >
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading map...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-glass ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        }}
      >
        {/* Coverage Circle */}
        <Circle
          center={KITCHEN_LOCATION}
          radius={COVERAGE_RADIUS_METERS}
          options={{
            fillColor: "#D4AF37",
            fillOpacity: 0.1,
            strokeColor: "#D4AF37",
            strokeOpacity: 0.6,
            strokeWeight: 2,
          }}
        />

        {/* Kitchen Marker */}
        <Marker
          position={KITCHEN_LOCATION}
          onClick={() => setShowKitchenInfo(true)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#8B1A1A",
            fillOpacity: 1,
            strokeColor: "#D4AF37",
            strokeWeight: 3,
          }}
        />

        {/* Kitchen Info Window */}
        {showKitchenInfo && (
          <InfoWindow
            position={KITCHEN_LOCATION}
            onCloseClick={() => setShowKitchenInfo(false)}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="font-display text-brand-red font-semibold text-sm mb-1">
                Mandalay Morning Star
              </h3>
              <p className="text-xs text-muted-foreground">
                {KITCHEN_LOCATION.address}
              </p>
              <p className="text-xs text-gold-dark mt-1 font-medium">
                Our Kitchen
              </p>
            </div>
          </InfoWindow>
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            onClick={() => setShowUserInfo(true)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#2E8B57",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            }}
          />
        )}

        {/* User Info Window */}
        {showUserInfo && userLocation && (
          <InfoWindow
            position={userLocation}
            onCloseClick={() => setShowUserInfo(false)}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="font-display text-jade font-semibold text-sm mb-1">
                Your Location
              </h3>
              <p className="text-xs text-muted-foreground">
                {userLocation.formattedAddress}
              </p>
            </div>
          </InfoWindow>
        )}

        {/* Route Polyline */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: "#8B1A1A",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>

      {/* Route Info Overlay */}
      <AnimatePresence>
        {routeInfo && userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 glass rounded-xl p-4 shadow-premium"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-brand-red" />
                  <span className="text-sm font-medium">
                    {routeInfo.distanceMiles.toFixed(1)} mi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-jade" />
                  <span className="text-sm font-medium">
                    {routeInfo.durationMinutes} min
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Navigation className="w-3 h-3" />
                <span>Estimated drive</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute top-4 right-4 glass rounded-lg p-3 shadow-md">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-red border-2 border-gold" />
            <span className="text-muted-foreground">Our Kitchen</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-jade border-2 border-white" />
              <span className="text-muted-foreground">Your Address</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold/30 border border-gold" />
            <span className="text-muted-foreground">50mi Coverage</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoverageMap;
