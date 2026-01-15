/**
 * V2 Sprint 3: Tracking Subscription Hook
 *
 * Provides real-time updates for customer order tracking using Supabase Realtime.
 * Subscribes to:
 * - Order status changes
 * - Route stop status/ETA changes
 * - Driver location updates
 *
 * Falls back to polling if Realtime connection fails.
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { OrderStatus } from "@/types/database";
import type {
  RouteStopStatus,
  DriverLocation,
  RealtimeOrderUpdate,
  RealtimeRouteStopUpdate,
  RealtimeLocationUpdate,
  TrackingSubscriptionState,
} from "@/types/tracking";

// Polling interval in ms (fallback when Realtime unavailable)
const POLLING_INTERVAL = 30000; // 30 seconds

// Retry delay for reconnection attempts
const RECONNECT_DELAY = 5000; // 5 seconds

interface UseTrackingSubscriptionOptions {
  orderId: string;
  routeId?: string | null;
  enabled?: boolean;
  onOrderUpdate?: (status: OrderStatus) => void;
  onStopUpdate?: (stopData: Partial<RealtimeRouteStopUpdate>) => void;
  onLocationUpdate?: (location: DriverLocation) => void;
}

interface UseTrackingSubscriptionReturn extends TrackingSubscriptionState {
  refresh: () => Promise<void>;
}

/**
 * Hook for subscribing to real-time tracking updates
 */
export function useTrackingSubscription({
  orderId,
  routeId,
  enabled = true,
  onOrderUpdate,
  onStopUpdate,
  onLocationUpdate,
}: UseTrackingSubscriptionOptions): UseTrackingSubscriptionReturn {
  const [state, setState] = useState<TrackingSubscriptionState>({
    isConnected: false,
    connectionError: null,
    orderStatus: null,
    stopStatus: null,
    driverLocation: null,
    stopEta: null,
    deliveryPhotoUrl: null,
    lastUpdate: null,
  });

  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const locationChannelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch current tracking data (for initial load and polling fallback)
   */
  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking/${orderId}`);
      if (response.ok) {
        const { data } = await response.json();
        setState((prev) => ({
          ...prev,
          orderStatus: data.order.status,
          stopStatus: data.routeStop?.status ?? null,
          stopEta: data.routeStop?.eta ?? null,
          deliveryPhotoUrl: data.routeStop?.deliveryPhotoUrl ?? null,
          driverLocation: data.driverLocation,
          lastUpdate: new Date(),
        }));
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    }
  }, [orderId]);

  /**
   * Handle order update from Realtime
   */
  const handleOrderUpdate = useCallback(
    (payload: { new: RealtimeOrderUpdate }) => {
      const newStatus = payload.new.status as OrderStatus;
      setState((prev) => ({
        ...prev,
        orderStatus: newStatus,
        lastUpdate: new Date(),
      }));
      onOrderUpdate?.(newStatus);
    },
    [onOrderUpdate]
  );

  /**
   * Handle route stop update from Realtime
   */
  const handleRouteStopUpdate = useCallback(
    (payload: { new: RealtimeRouteStopUpdate }) => {
      const { status, eta, delivery_photo_url } = payload.new;
      setState((prev) => ({
        ...prev,
        stopStatus: status as RouteStopStatus,
        stopEta: eta,
        deliveryPhotoUrl: delivery_photo_url,
        lastUpdate: new Date(),
      }));
      onStopUpdate?.(payload.new);
    },
    [onStopUpdate]
  );

  /**
   * Handle location update from Realtime
   */
  const handleLocationUpdate = useCallback(
    (payload: { new: RealtimeLocationUpdate }) => {
      const location: DriverLocation = {
        latitude: payload.new.latitude,
        longitude: payload.new.longitude,
        recorded_at: payload.new.recorded_at,
        accuracy: payload.new.accuracy,
        heading: payload.new.heading,
      };
      setState((prev) => ({
        ...prev,
        driverLocation: location,
        lastUpdate: new Date(),
      }));
      onLocationUpdate?.(location);
    },
    [onLocationUpdate]
  );

  /**
   * Start polling as fallback
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(fetchTrackingData, POLLING_INTERVAL);
  }, [fetchTrackingData]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Setup Realtime subscriptions
   */
  const setupSubscriptions = useCallback(() => {
    // Clean up existing channels
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create main channel for order and route_stop updates
    const channelName = `tracking:${orderId}`;
    const channel = supabase
      .channel(channelName)
      // Subscribe to order status changes
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        handleOrderUpdate
      )
      // Subscribe to route_stop changes
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "route_stops",
          filter: `order_id=eq.${orderId}`,
        },
        handleRouteStopUpdate
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setState((prev) => ({
            ...prev,
            isConnected: true,
            connectionError: null,
          }));
          stopPolling();
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            connectionError: "Connection lost. Retrying...",
          }));
          startPolling();
          // Schedule reconnection attempt
          reconnectTimeoutRef.current = setTimeout(() => {
            setupSubscriptions();
          }, RECONNECT_DELAY);
        }
      });

    channelRef.current = channel;
  }, [
    orderId,
    supabase,
    handleOrderUpdate,
    handleRouteStopUpdate,
    startPolling,
    stopPolling,
  ]);

  /**
   * Setup location subscription (separate channel for higher frequency)
   */
  const setupLocationSubscription = useCallback(() => {
    if (!routeId) return;

    // Clean up existing channel
    if (locationChannelRef.current) {
      supabase.removeChannel(locationChannelRef.current);
    }

    const locationChannel = supabase
      .channel(`location:${routeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "location_updates",
          filter: `route_id=eq.${routeId}`,
        },
        handleLocationUpdate
      )
      .subscribe();

    locationChannelRef.current = locationChannel;
  }, [routeId, supabase, handleLocationUpdate]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchTrackingData();
  }, [fetchTrackingData]);

  // Setup subscriptions on mount
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchTrackingData();

    // Setup Realtime subscriptions
    setupSubscriptions();

    return () => {
      // Cleanup on unmount
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (locationChannelRef.current) {
        supabase.removeChannel(locationChannelRef.current);
        locationChannelRef.current = null;
      }
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, fetchTrackingData, setupSubscriptions, supabase, stopPolling]);

  // Setup location subscription when routeId changes
  useEffect(() => {
    if (!enabled || !routeId) {
      return;
    }

    setupLocationSubscription();

    return () => {
      if (locationChannelRef.current) {
        supabase.removeChannel(locationChannelRef.current);
        locationChannelRef.current = null;
      }
    };
  }, [enabled, routeId, setupLocationSubscription, supabase]);

  return {
    ...state,
    refresh,
  };
}

/**
 * Helper hook to determine if we should show the live tracking map
 */
export function useShowLiveTracking(
  orderStatus: OrderStatus | null,
  driverLocation: DriverLocation | null
): boolean {
  return orderStatus === "out_for_delivery" && driverLocation !== null;
}

/**
 * Helper hook to format "last updated" time
 */
export function useLastUpdateDisplay(lastUpdate: Date | null): string {
  const [display, setDisplay] = useState<string>("");

  useEffect(() => {
    if (!lastUpdate) {
      setDisplay("");
      return;
    }

    const updateDisplay = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdate.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);

      if (diffSeconds < 10) {
        setDisplay("Just now");
      } else if (diffSeconds < 60) {
        setDisplay(`${diffSeconds}s ago`);
      } else if (diffMinutes < 60) {
        setDisplay(`${diffMinutes}m ago`);
      } else {
        setDisplay(
          lastUpdate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        );
      }
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return display;
}
