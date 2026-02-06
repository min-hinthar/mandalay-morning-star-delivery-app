"use client";

import { m } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface StreakDisplayProps {
  days: number;
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const isOnFire = days >= 5;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={getSpring(spring.ultraBouncy)}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-gradient-to-r",
        isOnFire
          ? "from-orange-500/20 via-red-500/20 to-yellow-500/20 border-orange-500/30"
          : "from-primary/10 to-secondary/10 border-primary/20",
        "border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <m.div
            animate={
              shouldAnimate && isOnFire
                ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                : undefined
            }
            transition={{ duration: 0.5, repeat: 5, repeatDelay: 1 }}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              isOnFire ? "bg-orange-500/20" : "bg-primary/10"
            )}
          >
            <Flame
              className={cn(
                "w-6 h-6",
                isOnFire ? "text-orange-500" : "text-primary"
              )}
            />
          </m.div>
          <div>
            <p className="font-semibold text-text-primary">
              {days} Day Streak!
            </p>
            <p className="text-sm text-text-muted">
              {isOnFire ? "You're on fire! Keep going!" : "Keep delivering daily!"}
            </p>
          </div>
        </div>

        {/* Fire particles when on streak */}
        {isOnFire && shouldAnimate && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <m.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-orange-400"
                initial={{
                  x: `${20 + Math.random() * 60}%`,
                  y: "100%",
                  opacity: 0,
                }}
                animate={{
                  y: "-20%",
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  repeat: 5,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </m.div>
  );
}
