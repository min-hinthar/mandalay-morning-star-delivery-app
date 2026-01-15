"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}

interface LocationError {
  code: number;
  message: string;
}

interface UseLocationTrackingOptions {
  enabled: boolean;
  routeId?: string;
  // Minimum interval between server updates (ms)
  minUpdateInterval?: number;
  // Enable high accuracy GPS (uses more battery)
  highAccuracy?: boolean;
}

interface UseLocationTrackingReturn {
  location: LocationState | null;
  error: LocationError | null;
  isTracking: boolean;
  isUpdating: boolean;
  lastServerUpdate: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

// Rate limit: minimum 1 minute between server updates
const DEFAULT_MIN_UPDATE_INTERVAL = 60000;

// Adaptive update intervals based on speed
const SPEED_THRESHOLDS = {
  STATIONARY: 0.5, // m/s (~1 mph)
  WALKING: 2, // m/s (~4.5 mph)
  DRIVING: 10, // m/s (~22 mph)
};

const ADAPTIVE_INTERVALS = {
  STATIONARY: 600000, // 10 minutes
  WALKING: 300000, // 5 minutes
  DRIVING: 120000, // 2 minutes
};

function getAdaptiveInterval(speed: number | null): number {
  if (speed === null || speed < SPEED_THRESHOLDS.STATIONARY) {
    return ADAPTIVE_INTERVALS.STATIONARY;
  }
  if (speed < SPEED_THRESHOLDS.WALKING) {
    return ADAPTIVE_INTERVALS.WALKING;
  }
  return ADAPTIVE_INTERVALS.DRIVING;
}

export function useLocationTracking({
  enabled,
  routeId,
  minUpdateInterval = DEFAULT_MIN_UPDATE_INTERVAL,
  highAccuracy = true,
}: UseLocationTrackingOptions): UseLocationTrackingReturn {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastServerUpdate, setLastServerUpdate] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send location to server
  const sendLocationUpdate = useCallback(
    async (loc: LocationState) => {
      // Check rate limit
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      const adaptiveInterval = getAdaptiveInterval(loc.speed);
      const effectiveInterval = Math.max(minUpdateInterval, adaptiveInterval);

      if (timeSinceLastUpdate < effectiveInterval) {
        // Schedule next update
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        const remainingTime = effectiveInterval - timeSinceLastUpdate;
        updateTimeoutRef.current = setTimeout(() => {
          sendLocationUpdate(loc);
        }, remainingTime);
        return;
      }

      setIsUpdating(true);

      try {
        const response = await fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            heading: loc.heading,
            speed: loc.speed,
            routeId,
          }),
        });

        if (response.ok) {
          lastUpdateTimeRef.current = now;
          setLastServerUpdate(new Date().toISOString());
        } else if (response.status === 429) {
          // Rate limited by server - wait longer
          lastUpdateTimeRef.current = now;
        }
      } catch {
        // Network error - will retry on next location update
      } finally {
        setIsUpdating(false);
      }
    },
    [routeId, minUpdateInterval]
  );

  // Handle position update
  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      const newLocation: LocationState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(position.timestamp).toISOString(),
      };

      setLocation(newLocation);
      setError(null);

      // Send to server if we have a route
      if (routeId) {
        sendLocationUpdate(newLocation);
      }
    },
    [routeId, sendLocationUpdate]
  );

  // Handle position error
  const handleError = useCallback((positionError: GeolocationPositionError) => {
    let message = "Unknown error";

    switch (positionError.code) {
      case positionError.PERMISSION_DENIED:
        message = "Location permission denied";
        break;
      case positionError.POSITION_UNAVAILABLE:
        message = "Location unavailable";
        break;
      case positionError.TIMEOUT:
        message = "Location request timed out";
        break;
    }

    setError({
      code: positionError.code,
      message,
    });
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: -1,
        message: "Geolocation not supported",
      });
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);
    setError(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 60000,
    });

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: highAccuracy,
        timeout: 30000,
        maximumAge: 30000,
      }
    );
  }, [handlePosition, handleError, highAccuracy]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    setIsTracking(false);
  }, []);

  // Auto start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  return {
    location,
    error,
    isTracking,
    isUpdating,
    lastServerUpdate,
    startTracking,
    stopTracking,
  };
}
