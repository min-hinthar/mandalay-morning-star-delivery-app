/**
 * SimpleStopView - Single-stop focus for simple mode drivers
 *
 * Shows only: customer name, address (tap opens Maps), phone (tap calls),
 * progress counter, Mark Delivered button with confirmation, and Call for Help.
 * Auto-advances to next stop after delivery confirmation.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Check, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import { DeliveryConfirmDialog } from "./DeliveryConfirmDialog";
import type { RouteStopStatus } from "@/types/driver";

// Operator phone number — hardcoded for MVP
const OPERATOR_PHONE = "+16269001234";

interface SimpleStopData {
  id: string;
  stopIndex: number;
  status: RouteStopStatus;
  order: {
    id: string;
    customer: { fullName: string | null };
    address: { line1: string; line2: string | null; city: string; state: string };
    phone?: string | null;
  };
}

interface SimpleStopViewProps {
  routeId: string;
  stops: SimpleStopData[];
}

export function SimpleStopView({ routeId, stops }: SimpleStopViewProps) {
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { queueStatusUpdate } = useOfflineSync();

  // Track local statuses for optimistic updates
  const [localStatuses, setLocalStatuses] = useState<Record<string, RouteStopStatus>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Get effective status for a stop (local override or server)
  const getStatus = useCallback(
    (stop: SimpleStopData): RouteStopStatus => localStatuses[stop.id] ?? stop.status,
    [localStatuses]
  );

  // Calculate progress
  const deliveredCount = stops.filter(
    (s) => getStatus(s) === "delivered" || getStatus(s) === "skipped"
  ).length;
  const totalCount = stops.length;

  // Find current stop (first pending or enroute)
  const currentStop = stops.find((s) => {
    const st = getStatus(s);
    return st === "pending" || st === "enroute";
  });

  const allDone = !currentStop && totalCount > 0;

  // Build address string
  const getFullAddress = (stop: SimpleStopData) => {
    const addr = stop.order.address;
    return [addr.line1, addr.line2, `${addr.city}, ${addr.state}`].filter(Boolean).join(", ");
  };

  const openMaps = useCallback(() => {
    if (!currentStop) return;
    const address = getFullAddress(currentStop);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }, [currentStop]);

  const handleMarkDelivered = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmDelivery = useCallback(async () => {
    if (!currentStop || isUpdating) return;
    setIsUpdating(true);

    try {
      if (!navigator.onLine) {
        await queueStatusUpdate(routeId, currentStop.id, "delivered");
      } else {
        const response = await fetch(
          `/api/driver/routes/${routeId}/stops/${currentStop.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "delivered" }),
          }
        );

        if (!response.ok && response.status >= 500) {
          await queueStatusUpdate(routeId, currentStop.id, "delivered");
        } else if (!response.ok) {
          throw new Error("Failed to update");
        }
      }

      // Optimistic update
      setLocalStatuses((prev) => ({ ...prev, [currentStop.id]: "delivered" }));
      setShowConfirm(false);

      // Show success animation
      setShowSuccess(true);
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        router.refresh();
      }, 1500);
    } catch (err) {
      if (err instanceof TypeError) {
        await queueStatusUpdate(routeId, currentStop.id, "delivered");
        setLocalStatuses((prev) => ({ ...prev, [currentStop.id]: "delivered" }));
        setShowConfirm(false);
        setShowSuccess(true);
        successTimerRef.current = setTimeout(() => {
          setShowSuccess(false);
          router.refresh();
        }, 1500);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [currentStop, isUpdating, routeId, queueStatusUpdate, router]);

  // All Done screen
  if (allDone) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-4"
      >
        <m.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <PartyPopper className="h-20 w-20 text-green" />
        </m.div>
        <h1 className="mt-6 font-display text-3xl font-bold text-text-primary">All Done!</h1>
        <p className="mt-2 font-body text-lg text-text-secondary">
          Great job! All deliveries complete.
        </p>
        <button
          onClick={() => router.push("/driver")}
          className={cn(
            "mt-8 flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-card-sm",
            "bg-accent-teal font-body text-lg font-semibold text-text-inverse shadow-md",
            "transition-all duration-fast hover:shadow-lg",
            "active:scale-[0.98]"
          )}
        >
          Go Home
        </button>
      </m.div>
    );
  }

  // No current stop and no stops at all
  if (!currentStop) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <p className="font-body text-lg text-text-muted">No stops available.</p>
      </div>
    );
  }

  const customerName = currentStop.order.customer.fullName ?? "Customer";
  const customerPhone = currentStop.order.phone;

  return (
    <div className="min-h-screen bg-surface-secondary pb-24">
      <div className="px-4 py-6 space-y-5">
        {/* Progress counter */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.default)}
          className="text-center"
        >
          <p className="font-body text-lg font-semibold text-text-primary">
            {deliveredCount} of {totalCount} done
          </p>
          <div className="mt-2 mx-auto h-2 w-48 overflow-hidden rounded-full bg-surface-tertiary">
            <m.div
              initial={{ width: 0 }}
              animate={{
                width: `${totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-accent-teal"
            />
          </div>
        </m.div>

        {/* Customer Name */}
        <m.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.05 }}
          className="text-center"
        >
          <h1 className="font-display text-2xl font-bold text-text-primary">{customerName}</h1>
        </m.div>

        {/* Address - tap opens Maps */}
        <m.button
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.1 }}
          onClick={openMaps}
          className={cn(
            "flex w-full min-h-[56px] items-center gap-3 rounded-card-sm",
            "bg-surface-primary p-4 shadow-sm border border-border",
            "transition-all duration-fast hover:shadow-md active:scale-[0.99]"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="font-body text-sm text-text-muted">Tap to navigate</p>
            <p className="font-body font-medium text-text-primary">
              {currentStop.order.address.line1}
            </p>
            <p className="font-body text-sm text-text-secondary">
              {currentStop.order.address.city}, {currentStop.order.address.state}
            </p>
          </div>
        </m.button>

        {/* Phone - tap calls */}
        {customerPhone && (
          <m.a
            href={`tel:${customerPhone}`}
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ ...getSpring(spring.default), delay: 0.15 }}
            className={cn(
              "flex w-full min-h-[56px] items-center gap-3 rounded-card-sm",
              "bg-surface-primary p-4 shadow-sm border border-border",
              "transition-all duration-fast hover:shadow-md active:scale-[0.99]"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green/10">
              <Phone className="h-5 w-5 text-green" />
            </div>
            <div className="text-left">
              <p className="font-body text-sm text-text-muted">Tap to call</p>
              <p className="font-body font-medium text-text-primary">{customerPhone}</p>
            </div>
          </m.a>
        )}

        {/* Mark Delivered - large button */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.2 }}
        >
          <button
            onClick={handleMarkDelivered}
            className={cn(
              "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card-sm",
              "bg-green font-body text-xl font-semibold text-text-inverse shadow-md",
              "transition-all duration-fast hover:bg-green/90 hover:shadow-lg",
              "active:scale-[0.98]"
            )}
            data-testid="simple-mark-delivered"
          >
            <Check className="h-7 w-7" />
            <span>Mark Delivered</span>
          </button>
        </m.div>

        {/* Call for Help */}
        <m.a
          href={`tel:${OPERATOR_PHONE}`}
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.25 }}
          className={cn(
            "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-card-sm",
            "border-2 border-border bg-surface-primary font-body font-medium text-text-primary",
            "transition-all duration-fast hover:bg-surface-secondary",
            "active:scale-[0.98]"
          )}
        >
          <Phone className="h-5 w-5" />
          <span>Call for Help</span>
        </m.a>
      </div>

      {/* Confirmation Dialog */}
      <DeliveryConfirmDialog
        isOpen={showConfirm}
        address={currentStop.order.address.line1}
        onConfirm={handleConfirmDelivery}
        onCancel={() => setShowConfirm(false)}
        isLoading={isUpdating}
      />

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-green/90"
          >
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center"
            >
              <Check className="mx-auto h-20 w-20 text-text-inverse" strokeWidth={3} />
              <p className="mt-4 font-display text-3xl font-bold text-text-inverse">
                Delivered!
              </p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
