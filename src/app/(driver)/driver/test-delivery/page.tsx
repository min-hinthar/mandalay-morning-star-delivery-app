/**
 * Test Delivery Page - Practice delivery flow with zero database writes
 *
 * Lets new drivers experience the full delivery workflow using mock data.
 * All state managed locally. testMode=true on all API-calling components.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Home,
  CheckCircle2,
  Truck,
  MapPin,
  Package,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { StopCard } from "@/components/ui/driver/StopCard";
import { StopDetail } from "@/components/ui/driver/StopDetail";
import { ExceptionModal } from "@/components/ui/driver/ExceptionModal";
import { DriverHeader } from "@/components/ui/driver/DriverHeader";
import type { RouteStopStatus } from "@/types/driver";

// ============================================
// TYPES
// ============================================

type TestStep = "overview" | "route" | "stop" | "complete";

interface MockStop {
  id: string;
  stopIndex: number;
  status: RouteStopStatus;
  customer: { fullName: string; phone: string };
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;
  };
  timeWindow: { start: string | null; end: string | null };
  deliveryNotes: string | null;
  orderItems: { id: string; name: string; quantity: number; modifiers?: string[] }[];
}

// ============================================
// MOCK DATA
// ============================================

const INITIAL_STOPS: MockStop[] = [
  {
    id: "test-stop-1",
    stopIndex: 1,
    status: "pending",
    customer: { fullName: "Test Customer A", phone: "+1 (555) 000-0001" },
    address: {
      line1: "123 Practice Lane",
      line2: "Apt 4B",
      city: "Portland",
      state: "OR",
      zipCode: "97201",
      latitude: 45.5152,
      longitude: -122.6784,
    },
    timeWindow: { start: null, end: null },
    deliveryNotes: "Leave at front door",
    orderItems: [
      { id: "item-1", name: "Naan Bread (4pc)", quantity: 2 },
      { id: "item-2", name: "Chicken Biryani", quantity: 1, modifiers: ["Extra spicy"] },
    ],
  },
  {
    id: "test-stop-2",
    stopIndex: 2,
    status: "pending",
    customer: { fullName: "Test Customer B", phone: "+1 (555) 000-0002" },
    address: {
      line1: "456 Demo Street",
      line2: null,
      city: "Portland",
      state: "OR",
      zipCode: "97202",
      latitude: 45.5051,
      longitude: -122.675,
    },
    timeWindow: { start: null, end: null },
    deliveryNotes: null,
    orderItems: [
      { id: "item-3", name: "Samosa (6pc)", quantity: 1 },
      { id: "item-4", name: "Mango Lassi", quantity: 2 },
    ],
  },
];

const MOCK_ROUTE_ID = "test-route-000";

// ============================================
// MAIN COMPONENT
// ============================================

export default function TestDeliveryPage() {
  const router = useRouter();
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();

  // State
  const [testStep, setTestStep] = useState<TestStep>("overview");
  const [stops, setStops] = useState<MockStop[]>(INITIAL_STOPS);
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);
  const [, setRouteStatus] = useState<"planned" | "in_progress" | "completed">("planned");
  const [showException, setShowException] = useState(false);

  // Derived
  const currentStop = stops.find((s) => s.id === currentStopId);
  const deliveredCount = stops.filter((s) => s.status === "delivered").length;
  const skippedCount = stops.filter((s) => s.status === "skipped").length;

  // Handlers
  const handleStartRoute = useCallback(() => {
    setRouteStatus("in_progress");
    setTestStep("route");
  }, []);

  const handleStopClick = useCallback((stopId: string) => {
    setCurrentStopId(stopId);
    setTestStep("stop");
  }, []);

  const handleStatusChange = useCallback(
    (newStatus: RouteStopStatus) => {
      setStops((prev) =>
        prev.map((s) => (s.id === currentStopId ? { ...s, status: newStatus } : s))
      );

      // If delivered or skipped, go back to route view after brief delay
      if (newStatus === "delivered" || newStatus === "skipped") {
        setTimeout(() => {
          // Check if all stops are done
          const updatedStops = stops.map((s) =>
            s.id === currentStopId ? { ...s, status: newStatus } : s
          );
          const allComplete = updatedStops.every(
            (s) => s.status === "delivered" || s.status === "skipped"
          );

          if (allComplete) {
            setRouteStatus("completed");
            setTestStep("complete");
          } else {
            setTestStep("route");
          }
          setCurrentStopId(null);
        }, 800);
      }
    },
    [currentStopId, stops]
  );

  const handleExceptionSuccess = useCallback(() => {
    if (currentStopId) {
      handleStatusChange("skipped");
    }
  }, [currentStopId, handleStatusChange]);

  const resetAll = useCallback(() => {
    setStops(INITIAL_STOPS);
    setCurrentStopId(null);
    setRouteStatus("planned");
    setTestStep("overview");
    setShowException(false);
  }, []);

  // ============================================
  // VIEWS
  // ============================================

  const renderOverview = () => (
    <m.div
      key="overview"
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      exit={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
      transition={getSpring(spring.default)}
      className="space-y-6 p-4"
    >
      {/* Intro card */}
      <div
        className={cn(
          "rounded-2xl border-2 border-accent-teal shadow-card p-6",
          "bg-surface-primary/80 sm:backdrop-blur-sm",
          "text-center space-y-3"
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-teal/10">
          <Truck className="h-8 w-8 text-accent-teal" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Practice Delivery</h2>
        <p className="text-sm text-text-secondary">
          Walk through a delivery without affecting real data. Practice arriving, delivering, and
          handling exceptions.
        </p>
      </div>

      {/* Stop preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          {stops.length} Test Stops
        </h3>
        {stops.map((stop) => (
          <div
            key={stop.id}
            className="flex items-center gap-3 rounded-xl bg-surface-primary p-3 border border-border"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-text-primary text-xs font-bold text-text-inverse">
              {stop.stopIndex}
            </span>
            <div>
              <p className="font-medium text-text-primary">{stop.customer.fullName}</p>
              <p className="text-sm text-text-muted">{stop.address.line1}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Start button */}
      <m.button
        whileTap={isFullMotion ? { scale: 0.98 } : undefined}
        onClick={handleStartRoute}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-3 rounded-2xl",
          "font-semibold text-text-inverse",
          "bg-green shadow-md",
          "hover:bg-green/90 transition-all duration-fast"
        )}
      >
        <Play className="h-6 w-6" />
        <span>Start Test Route</span>
      </m.button>
    </m.div>
  );

  const renderRoute = () => (
    <m.div
      key="route"
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      exit={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
      transition={getSpring(spring.default)}
      className="space-y-4 p-4"
    >
      {/* Progress */}
      <div className="rounded-xl bg-surface-primary p-4 shadow-sm border border-border">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-text-primary">Progress</span>
          <span className="text-text-secondary">
            {deliveredCount + skippedCount}/{stops.length} stops
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
          <m.div
            initial={{ width: 0 }}
            animate={{
              width: `${((deliveredCount + skippedCount) / stops.length) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="h-full rounded-full bg-accent-teal"
          />
        </div>
      </div>

      {/* Stop cards */}
      <div className="space-y-3">
        {stops.map((stop) => (
          <StopCard
            key={stop.id}
            stopIndex={stop.stopIndex}
            status={stop.status}
            customerName={stop.customer.fullName}
            address={stop.address}
            timeWindow={stop.timeWindow}
            isCurrentStop={
              stop.status !== "delivered" &&
              stop.status !== "skipped" &&
              stop.stopIndex ===
                (stops.find((s) => s.status !== "delivered" && s.status !== "skipped")?.stopIndex ??
                  0)
            }
            onClick={() => handleStopClick(stop.id)}
          />
        ))}
      </div>
    </m.div>
  );

  const renderStopDetail = () => {
    if (!currentStop) return null;

    return (
      <m.div
        key="stop"
        initial={shouldAnimate ? { opacity: 0, x: 30 } : undefined}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        exit={shouldAnimate ? { opacity: 0, x: -30 } : undefined}
        transition={getSpring(spring.default)}
        className="p-4"
      >
        <button
          type="button"
          onClick={() => {
            setCurrentStopId(null);
            setTestStep("route");
          }}
          className="flex min-h-[44px] items-center gap-1 mb-4 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to route
        </button>

        <StopDetail
          routeId={MOCK_ROUTE_ID}
          stopId={currentStop.id}
          stopIndex={currentStop.stopIndex}
          totalStops={stops.length}
          status={currentStop.status}
          customer={currentStop.customer}
          address={currentStop.address}
          timeWindow={currentStop.timeWindow}
          deliveryNotes={currentStop.deliveryNotes}
          orderItems={currentStop.orderItems}
          onStatusChange={handleStatusChange}
          onException={() => setShowException(true)}
        />
      </m.div>
    );
  };

  const renderComplete = () => (
    <m.div
      key="complete"
      initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      transition={getSpring(spring.ultraBouncy)}
      className="p-4"
    >
      <div
        className={cn(
          "rounded-2xl border-2 border-accent-teal shadow-card p-8",
          "bg-surface-primary/80 sm:backdrop-blur-sm",
          "text-center space-y-4"
        )}
      >
        <m.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: [0, 1.3, 1] } : undefined}
          transition={{ duration: 0.6, times: [0, 0.6, 1] }}
        >
          <CheckCircle2 className="h-16 w-16 text-accent-teal mx-auto" />
        </m.div>

        <h2 className="text-2xl font-bold text-text-primary">Practice Complete!</h2>

        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-green" />
            <span className="text-text-primary font-medium">{deliveredCount} delivered</span>
          </div>
          {skippedCount > 0 && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-status-error" />
              <span className="text-text-primary font-medium">{skippedCount} skipped</span>
            </div>
          )}
        </div>

        <p className="text-sm text-text-muted">
          Great job! You completed the practice delivery. Feel free to run it again or head back to
          your dashboard.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <m.button
            whileTap={isFullMotion ? { scale: 0.98 } : undefined}
            onClick={resetAll}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-3 rounded-2xl",
              "font-semibold text-text-inverse",
              "bg-accent-teal shadow-md",
              "hover:bg-accent-teal/90 transition-all"
            )}
          >
            <RotateCcw className="h-5 w-5" />
            <span>Run Again</span>
          </m.button>

          <button
            onClick={() => router.push("/driver")}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-2xl",
              "font-medium text-text-secondary",
              "border border-border bg-surface-primary",
              "hover:bg-surface-secondary transition-all"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </m.div>
  );

  return (
    <>
      <DriverHeader title="Test Delivery" showBack backHref="/driver" />

      <div className="min-h-screen bg-gradient-to-b from-surface-primary to-surface-tertiary/30">
        <AnimatePresence mode="wait">
          {testStep === "overview" && renderOverview()}
          {testStep === "route" && renderRoute()}
          {testStep === "stop" && renderStopDetail()}
          {testStep === "complete" && renderComplete()}
        </AnimatePresence>
      </div>

      {/* Exception Modal */}
      {currentStop && (
        <ExceptionModal
          isOpen={showException}
          onClose={() => setShowException(false)}
          routeId={MOCK_ROUTE_ID}
          stopId={currentStop.id}
          onSuccess={handleExceptionSuccess}
          testMode
        />
      )}
    </>
  );
}
