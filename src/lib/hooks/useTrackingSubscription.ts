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
import { getBackoffDelay } from "@/lib/utils/backoff";
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

// Reconnect delay replaced by getBackoffDelay() — Phase 112 Plan 01 TRAK-04.
// Curve: [1000, 2000, 4000, 8000, 16000, 30000, 30000, ...] vs linear 5000ms.

/**
 * Backoff for re-reading cancellation details after realtime reports a
 * cancellation. Two extra attempts, ~4s total — long enough for the audit
 * insert that follows the committed status UPDATE, short enough that a
 * customer watching the page is not left staring at an unexplained overlay.
 */
const CANCELLATION_RETRY_DELAYS_MS = [1000, 3000];

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
    cancellationReason: null,
    cancelledAt: null,
    cancellationSynced: false,
    lastUpdate: null,
  });

  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const locationChannelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cancellationRetryRef = useRef<NodeJS.Timeout | null>(null);
  // Settles the retry loop's pending delay. Clearing the timeout alone would
  // leave that promise unresolved forever, so the loop would hang instead of
  // returning and never reach its abandon check.
  const cancellationWakeRef = useRef<(() => void) | null>(null);
  const abandonCancellationSyncRef = useRef(false);
  // TRAK-04: attempt counter for exponential backoff (ref not state — avoids re-render storms)
  const attemptRef = useRef<number>(0);
  // TRAK-03: visibility handler stored in ref to avoid stale closures without useEffectEvent
  const visibilityHandlerRef = useRef<() => void>(() => {});

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
          // Adopted ONLY when the lookup actually succeeded.
          // getOrderCancellation swallows a failed audit-log read into a null
          // while the API still answers 200, so assigning unconditionally would
          // let a transient failure overwrite a good reason with nothing AND
          // mark it authoritative — hiding it for the rest of the session.
          // Skipping leaves the previous values untouched, so a failure changes
          // nothing rather than making things worse.
          ...(data.order.cancellationKnown
            ? {
                // Only ever set for a cancelled order, and only for the owner —
                // the API withholds it from share-token holders.
                cancellationReason: data.order.cancellationReason ?? null,
                cancelledAt: data.order.cancelledAt ?? null,
                cancellationSynced: true,
              }
            : {}),
          lastUpdate: new Date(),
        }));
        return data.order as { cancelledAt: string | null };
      }
    } catch {
      // Network error — will retry on next poll or realtime reconnect
    }
    return null;
  }, [orderId]);

  /**
   * Pull cancellation details, retrying briefly until the audit row lands.
   *
   * Both admin routes commit the `orders` UPDATE and only THEN insert the
   * order_audit_log row, so realtime can deliver `cancelled` before the reason
   * exists. A healthy realtime connection has already called stopPolling(), so
   * the first empty answer would otherwise stand until a reload.
   *
   * `cancelledAt` is the probe, not the reason: it is non-null whenever an
   * audit row exists AT ALL — including one whose reason is deliberately
   * withheld because the admin opted out of notifying. So a legitimately
   * reason-less cancellation settles on the first attempt instead of burning
   * every retry, and only a genuinely absent row keeps trying.
   */
  const syncCancellationDetails = useCallback(async () => {
    if ((await fetchTrackingData())?.cancelledAt) return;

    for (const delay of CANCELLATION_RETRY_DELAYS_MS) {
      await new Promise<void>((resolve) => {
        cancellationWakeRef.current = resolve;
        cancellationRetryRef.current = setTimeout(resolve, delay);
      });
      cancellationWakeRef.current = null;
      if (abandonCancellationSyncRef.current) return;
      if ((await fetchTrackingData())?.cancelledAt) return;
    }
  }, [fetchTrackingData]);

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

      // Realtime carries the `orders` row, which has no cancellation reason —
      // that lives in `order_audit_log` and only the API assembles it. Without
      // this, a customer watching the page when their order is cancelled sees
      // the overlay appear with no explanation until they reload. One extra
      // request, on a terminal transition that happens at most once.
      if (newStatus === "cancelled") {
        void syncCancellationDetails();
      }
    },
    [onOrderUpdate, syncCancellationDetails]
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
    // Clear any pending reconnect to prevent channel accumulation
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clean up existing channels
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
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
          // TRAK-04: reset attempt counter on successful connection
          attemptRef.current = 0;
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
            connectionError: "Reconnecting...",
          }));
          startPolling();
          // Clear any pending reconnect before scheduling a new one (race protection)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          // TRAK-04: exponential backoff (1s → 2s → 4s → 8s → 16s → 30s cap)
          const delay = getBackoffDelay(attemptRef.current);
          attemptRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            setupSubscriptions();
          }, delay);
        }
      });

    channelRef.current = channel;
  }, [orderId, supabase, handleOrderUpdate, handleRouteStopUpdate, startPolling, stopPolling]);

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

    // Re-arm the cancellation retry. This effect's cleanup latches the flag,
    // and cleanup runs on every dependency change — and twice on mount under
    // React Strict Mode — not only on unmount. Left latched, every later
    // cancellation would do the single race-prone fetch and skip both retries,
    // quietly restoring the audit-insert race the retry loop exists to close.
    abandonCancellationSyncRef.current = false;

    // Initial fetch
    fetchTrackingData();

    // Setup Realtime subscriptions
    setupSubscriptions();
    setupLocationSubscription();

    // TRAK-03: visibility pause/resume — mutable ref pattern avoids stale closures
    // without requiring React 19 `useEffectEvent` (locked assumption #1).
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === "hidden") {
        // Aggressive pause: remove BOTH channels, stop polling, clear reconnect
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
          reconnectTimeoutRef.current = null;
        }
      } else {
        // Resume: immediate refresh + re-subscribe both channels
        void fetchTrackingData();
        setupSubscriptions();
        setupLocationSubscription();
      }
    };

    // Stable listener reads ref.current — safe for empty-less deps
    const visibilityListener = () => visibilityHandlerRef.current();
    document.addEventListener("visibilitychange", visibilityListener);

    return () => {
      // TRAK-03: remove visibility listener (no leak)
      document.removeEventListener("visibilitychange", visibilityListener);

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
        reconnectTimeoutRef.current = null;
      }
      // Order matters: latch abandon BEFORE waking, so the resumed loop sees
      // it and returns rather than firing another fetch.
      abandonCancellationSyncRef.current = true;
      if (cancellationRetryRef.current) {
        clearTimeout(cancellationRetryRef.current);
        cancellationRetryRef.current = null;
      }
      cancellationWakeRef.current?.();
      cancellationWakeRef.current = null;
      attemptRef.current = 0;
    };
  }, [
    enabled,
    fetchTrackingData,
    setupSubscriptions,
    setupLocationSubscription,
    supabase,
    stopPolling,
  ]);

  // NOTE: Location subscription is now handled by the main useEffect above
  // (it depends on `setupLocationSubscription`, whose useCallback identity
  // changes when `routeId` changes, so the main effect re-runs for routeId
  // changes automatically). Removed the duplicate secondary effect in
  // Phase 112 Plan 01 to prevent double-subscribing on mount.

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
