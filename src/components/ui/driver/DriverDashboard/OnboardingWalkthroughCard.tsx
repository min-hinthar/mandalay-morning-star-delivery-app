/**
 * OnboardingWalkthroughCard - Guided onboarding milestones for new drivers
 *
 * Shows when driver has 0 deliveries. Three milestones: profile complete,
 * route viewed, first delivery. Celebration animation on completion.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Check, Circle, CheckCircle2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface OnboardingWalkthroughCardProps {
  driver: {
    id: string;
    fullName: string | null;
    phone: string | null;
    vehicleType: string | null;
    licensePlate: string | null;
    profileImageUrl: string | null;
  };
  deliveriesCount: number;
}

const STORAGE_KEY_DISMISSED = "walkthrough-dismissed";
const STORAGE_KEY_ROUTE_VIEWED = "walkthrough-route-viewed";

interface Milestone {
  key: string;
  label: string;
  href: string | null;
}

const milestones: Milestone[] = [
  { key: "profile", label: "Complete your profile", href: "/driver/profile" },
  { key: "route", label: "View today's route", href: "/driver/route" },
  { key: "delivery", label: "Complete your first delivery", href: null },
];

function getProfileComplete(driver: OnboardingWalkthroughCardProps["driver"]): boolean {
  return !!(
    driver.fullName &&
    driver.phone &&
    driver.vehicleType &&
    driver.licensePlate &&
    driver.profileImageUrl
  );
}

export function OnboardingWalkthroughCard({
  driver,
  deliveriesCount,
}: OnboardingWalkthroughCardProps) {
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash
  const [showCelebration, setShowCelebration] = useState(false);
  const [routeViewed, setRouteViewed] = useState(false);

  const isProfileComplete = useMemo(() => getProfileComplete(driver), [driver]);

  const completedStates = useMemo(
    () => [isProfileComplete, routeViewed, deliveriesCount > 0],
    [isProfileComplete, routeViewed, deliveriesCount]
  );
  const completedCount = completedStates.filter(Boolean).length;
  const allComplete = completedCount === 3;

  // Read localStorage on mount (SSR safety)
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
    const viewed = localStorage.getItem(STORAGE_KEY_ROUTE_VIEWED) === "true";
    setRouteViewed(viewed);

    // Don't show for experienced drivers
    if (deliveriesCount > 0 && dismissed) {
      setIsDismissed(true);
      return;
    }

    // Don't show if already dismissed
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Don't show for drivers with deliveries (card is for new drivers only)
    if (deliveriesCount > 0) {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
      setIsDismissed(true);
      return;
    }

    setIsDismissed(false);
  }, [deliveriesCount]);

  // Trigger celebration when all complete
  useEffect(() => {
    if (!allComplete || isDismissed) return;

    setShowCelebration(true);
    const timer = setTimeout(() => {
      setShowCelebration(false);
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
      setTimeout(() => setIsDismissed(true), 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [allComplete, isDismissed]);

  if (isDismissed && !showCelebration) return null;

  const handleMilestoneClick = (milestone: Milestone, isComplete: boolean) => {
    if (isComplete || !milestone.href) return;
    router.push(milestone.href);
  };

  return (
    <AnimatePresence mode="wait">
      {showCelebration ? (
        <m.div
          key="celebration"
          initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
          exit={shouldAnimate ? { scale: 0.5, opacity: 0 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className={cn(
            "rounded-2xl border-2 border-accent-teal shadow-card p-6",
            "bg-surface-primary/80 sm:backdrop-blur-sm",
            "flex flex-col items-center gap-3 relative"
          )}
        >
          <m.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1] }}
          >
            <CheckCircle2 className="h-12 w-12 text-accent-teal" />
          </m.div>
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-bold text-text-primary"
          >
            You&apos;re ready to deliver!
          </m.p>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-text-muted"
          >
            All milestones complete
          </m.p>
          {/* Celebration particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(8)].map((_, i) => (
              <m.div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full",
                  i % 4 === 0
                    ? "bg-accent-teal"
                    : i % 4 === 1
                      ? "bg-secondary"
                      : i % 4 === 2
                        ? "bg-primary"
                        : "bg-green-400"
                )}
                initial={{
                  x: "50%",
                  y: "50%",
                  opacity: 1,
                  scale: 0,
                }}
                animate={{
                  x: `${20 + Math.cos((i * Math.PI) / 4) * 80}%`,
                  y: `${20 + Math.sin((i * Math.PI) / 4) * 80}%`,
                  opacity: 0,
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.2 + i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </m.div>
      ) : (
        <m.div
          key="checklist"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          exit={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
          transition={getSpring(spring.default)}
          className={cn(
            "rounded-2xl border-2 border-accent-teal shadow-card p-4 space-y-3",
            "bg-surface-primary/80 sm:backdrop-blur-sm"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-accent-teal" />
              <h3 className="text-base font-semibold text-text-primary">Getting Started</h3>
            </div>
            <span className="text-sm font-medium text-text-muted">{completedCount}/3</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
            <m.div
              className="h-full rounded-full bg-accent-teal"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Milestone items */}
          <m.div
            variants={staggerContainer(0.03, 0.05)}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {milestones.map((milestone, index) => {
              const isComplete = completedStates[index];
              const isTappable = !isComplete && !!milestone.href;
              return (
                <m.button
                  key={milestone.key}
                  variants={staggerItem}
                  type="button"
                  onClick={() => handleMilestoneClick(milestone, isComplete)}
                  disabled={isComplete || !milestone.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors min-h-[44px]",
                    isComplete
                      ? "cursor-default"
                      : isTappable
                        ? "hover:bg-surface-secondary/50 active:bg-surface-secondary"
                        : "cursor-default opacity-70"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 shrink-0 text-accent-teal" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-text-muted" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      isComplete
                        ? "text-text-muted line-through"
                        : "text-text-primary font-medium"
                    )}
                  >
                    {milestone.label}
                  </span>
                </m.button>
              );
            })}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
