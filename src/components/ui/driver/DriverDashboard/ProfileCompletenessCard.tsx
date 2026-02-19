/**
 * ProfileCompletenessCard - Animated checklist with deep links and celebration
 *
 * Shows when driver profile is incomplete. Each item links to profile page
 * with field highlighting. Celebration animation on 100% completion.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Check, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface ProfileCompletenessCardProps {
  driver: {
    id: string;
    fullName: string | null;
    phone: string | null;
    vehicleType: string | null;
    licensePlate: string | null;
    profileImageUrl: string | null;
  };
}

const STORAGE_KEY = "profile-complete-dismissed";

const items = [
  { key: "name", label: "Add your name", field: "fullName" },
  { key: "phone", label: "Add phone number", field: "phone" },
  { key: "vehicleType", label: "Set vehicle type", field: "vehicleType" },
  { key: "licensePlate", label: "Add license plate", field: "licensePlate" },
  { key: "photo", label: "Upload a photo", field: "photo" },
] as const;

function getCompletionState(driver: ProfileCompletenessCardProps["driver"]) {
  const completed = [
    !!driver.fullName,
    !!driver.phone,
    !!driver.vehicleType,
    !!driver.licensePlate,
    !!driver.profileImageUrl,
  ];
  const completedCount = completed.filter(Boolean).length;
  return { completed, completedCount, isComplete: completedCount === 5 };
}

function getBorderColor(count: number): string {
  if (count <= 1) return "border-amber-400";
  if (count <= 3) return "border-yellow-400";
  return "border-green-500";
}

function getProgressColor(count: number): string {
  if (count <= 1) return "bg-amber-400";
  if (count <= 3) return "bg-yellow-400";
  return "bg-green-500";
}

export function ProfileCompletenessCard({ driver }: ProfileCompletenessCardProps) {
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash
  const [showCelebration, setShowCelebration] = useState(false);

  const { completed, completedCount, isComplete } = useMemo(
    () => getCompletionState(driver),
    [driver]
  );

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (isComplete && dismissed) {
      setIsDismissed(true);
      return;
    }
    if (isComplete && !dismissed) {
      // Trigger celebration
      setIsDismissed(false);
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
        localStorage.setItem(STORAGE_KEY, "true");
        setTimeout(() => setIsDismissed(true), 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Not complete — show checklist
    setIsDismissed(false);
  }, [isComplete]);

  const handleItemClick = useCallback(
    (field: string) => {
      if (field === "photo") {
        router.push("/driver/profile");
      } else {
        router.push(`/driver/profile?highlight=${field}`);
      }
    },
    [router]
  );

  if (isDismissed && !showCelebration) return null;

  return (
    <AnimatePresence mode="wait">
      {showCelebration ? (
        <m.div
          key="celebration"
          initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
          exit={shouldAnimate ? { scale: 0.5, opacity: 0 } : undefined}
          transition={getSpring(spring.default)}
          className={cn(
            "rounded-2xl border-2 border-green-500 shadow-card p-6",
            "bg-surface-primary/80 backdrop-blur-sm",
            "flex flex-col items-center gap-3"
          )}
        >
          <m.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1] }}
          >
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </m.div>
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-bold text-text-primary"
          >
            Profile complete!
          </m.p>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-text-muted"
          >
            You&apos;re all set for deliveries
          </m.p>
          {/* Celebration particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(8)].map((_, i) => (
              <m.div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full",
                  i % 4 === 0
                    ? "bg-green-400"
                    : i % 4 === 1
                      ? "bg-accent-teal"
                      : i % 4 === 2
                        ? "bg-secondary"
                        : "bg-primary"
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
            "rounded-2xl border-2 shadow-card p-4 space-y-3",
            "bg-surface-primary/80 backdrop-blur-sm",
            getBorderColor(completedCount)
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Complete your profile</h3>
            <span className="text-sm font-medium text-text-muted">{completedCount}/5</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
            <m.div
              className={cn("h-full rounded-full", getProgressColor(completedCount))}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Checklist items */}
          <m.div
            variants={staggerContainer(0.03, 0.05)}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {items.map((item, index) => {
              const isItemComplete = completed[index];
              return (
                <m.button
                  key={item.key}
                  variants={staggerItem}
                  type="button"
                  onClick={() => !isItemComplete && handleItemClick(item.field)}
                  disabled={isItemComplete}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isItemComplete
                      ? "cursor-default"
                      : "hover:bg-surface-secondary/50 active:bg-surface-secondary"
                  )}
                >
                  {isItemComplete ? (
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-text-muted" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      isItemComplete
                        ? "text-text-muted line-through"
                        : "text-text-primary font-medium"
                    )}
                  >
                    {item.label}
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
