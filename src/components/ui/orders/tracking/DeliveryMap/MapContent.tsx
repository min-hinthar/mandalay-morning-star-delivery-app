"use client";

/**
 * MapContent - Renders map overlays, markers (fallback), route lines, legend
 *
 * Extracted from DeliveryMap for file size compliance.
 */

import { GoogleMap, Marker } from "@react-google-maps/api";
import { Maximize2, X, LocateFixed } from "lucide-react";
import { mapStyles, containerStyle, MAP_ID } from "./constants";
import { RouteProgressLine } from "./RoutePolyline";
import { MapLegend } from "./MapLegend";

interface LatLng {
  lat: number;
  lng: number;
}

interface MapContentProps {
  inFullscreen: boolean;
  isLive: boolean;
  showDriverMarker: boolean;
  showRestaurantMarker: boolean;
  userHasPanned: boolean;
  isStale: boolean;
  staleMinutesAgo: number;
  lastLocationUpdate: Date | null | undefined;
  center: LatLng;
  customerLocation: { lat: number; lng: number; address: string };
  driverLocation: { lat: number; lng: number; heading: number | null } | null;
  restaurantLocation: LatLng | null | undefined;
  routePath: LatLng[];
  onLoad: (m: google.maps.Map) => void;
  onUnmount: () => void;
  onExpandFullscreen: () => void;
  onCloseFullscreen: () => void;
  onRecenter: () => void;
}

export function MapContent({
  inFullscreen,
  isLive,
  showDriverMarker,
  showRestaurantMarker,
  userHasPanned,
  isStale,
  staleMinutesAgo,
  lastLocationUpdate,
  center,
  customerLocation,
  driverLocation,
  restaurantLocation,
  routePath,
  onLoad,
  onUnmount,
  onExpandFullscreen,
  onCloseFullscreen,
  onRecenter,
}: MapContentProps) {
  return (
    <>
      {/* Live indicator */}
      {isLive && showDriverMarker && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 px-3 py-1.5 shadow-sm sm:backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-jade)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-jade)]" />
          </span>
          <span className="text-xs font-medium text-[var(--color-text-primary)]">
            Live tracking
          </span>
        </div>
      )}

      {/* Expand/close button */}
      {!inFullscreen && (
        <button
          onClick={onExpandFullscreen}
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 shadow-sm sm:backdrop-blur-sm transition-colors hover:bg-[var(--color-surface)]"
          aria-label="Expand map"
        >
          <Maximize2 className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
      )}
      {inFullscreen && (
        <button
          onClick={onCloseFullscreen}
          className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-lg transition-colors hover:bg-[var(--color-surface-muted)]"
          aria-label="Close fullscreen"
        >
          <X className="h-6 w-6 text-[var(--color-text-primary)]" />
        </button>
      )}

      {/* Re-center button */}
      {userHasPanned && (
        <button
          onClick={onRecenter}
          className="absolute bottom-16 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-md transition-all hover:bg-[var(--color-surface-muted)] hover:shadow-lg"
          aria-label="Re-center map"
        >
          <LocateFixed className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: inFullscreen ? "greedy" : "cooperative",
          ...(MAP_ID && { mapId: MAP_ID }),
        }}
      >
        {/* Route progress line */}
        <RouteProgressLine
          driverPosition={
            showDriverMarker && driverLocation
              ? { lat: driverLocation.lat, lng: driverLocation.lng }
              : null
          }
          destinationPosition={{
            lat: customerLocation.lat,
            lng: customerLocation.lng,
          }}
          restaurantPosition={restaurantLocation}
        />

        {/* Encoded route polyline (if available) */}
        {routePath.length > 0 && (
          <RouteProgressLine
            driverPosition={
              showDriverMarker && driverLocation
                ? { lat: driverLocation.lat, lng: driverLocation.lng }
                : null
            }
            destinationPosition={{
              lat: customerLocation.lat,
              lng: customerLocation.lng,
            }}
            restaurantPosition={restaurantLocation}
          />
        )}

        {/* Fallback markers when no MAP_ID */}
        {!MAP_ID && (
          <>
            <Marker
              position={{
                lat: customerLocation.lat,
                lng: customerLocation.lng,
              }}
              title={customerLocation.address}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#2E8B57",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 3,
              }}
            />
            {showDriverMarker && driverLocation && (
              <Marker
                position={{
                  lat: driverLocation.lat,
                  lng: driverLocation.lng,
                }}
                title="Your driver"
                icon={{
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: "#D4A017",
                  fillOpacity: isStale ? 0.5 : 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                  rotation: driverLocation.heading || 0,
                }}
              />
            )}
            {showRestaurantMarker && restaurantLocation && (
              <Marker
                position={restaurantLocation}
                title="Restaurant"
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#C75050",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 3,
                }}
              />
            )}
          </>
        )}
      </GoogleMap>

      {/* Legend */}
      <MapLegend
        inFullscreen={inFullscreen}
        showDriverMarker={showDriverMarker}
        showRestaurantMarker={showRestaurantMarker}
        isStale={isStale}
        staleMinutesAgo={staleMinutesAgo}
        lastLocationUpdate={lastLocationUpdate}
      />
    </>
  );
}
