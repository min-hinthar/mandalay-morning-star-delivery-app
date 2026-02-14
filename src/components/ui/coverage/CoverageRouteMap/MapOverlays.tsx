"use client";

import { m, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Navigation2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { COVERAGE_LIMITS } from "@/types/address";

interface MapOverlaysProps {
  hasDestination: boolean;
  isValid?: boolean;
  distanceMiles?: number;
  durationMinutes?: number;
}

export function MapOverlays({ hasDestination, isValid, distanceMiles, durationMinutes }: MapOverlaysProps) {
  return (
    <>
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />

      {/* Coverage limit badge - top left */}
      <m.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-3 left-3"
      >
        <div
          className={cn(
            "px-3 py-2 rounded-xl bg-surface-primary sm:bg-surface-primary/95 sm:backdrop-blur-md",
            "flex items-center gap-2 text-xs font-medium",
            "shadow-md ring-1 ring-border/30"
          )}
        >
          <m.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: 5 }}
            className="w-2.5 h-2.5 rounded-full bg-primary"
          />
          <span className="text-text-primary font-semibold">
            {COVERAGE_LIMITS.maxDistanceMiles} mi
          </span>
          <span className="text-text-muted/60">{"\u2022"}</span>
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-text-secondary">
            {COVERAGE_LIMITS.maxDurationMinutes} min
          </span>
        </div>
      </m.div>

      {/* Kitchen badge - top right */}
      <m.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-3 right-3"
      >
        <div
          className={cn(
            "px-2 py-1.5 rounded-xl bg-surface-primary sm:bg-surface-primary/95 sm:backdrop-blur-md",
            "flex items-center gap-2",
            "shadow-md ring-1 ring-border/30"
          )}
        >
          <Image
            src="/logo.png"
            alt="Mandalay Morning Star"
            width={28}
            height={19}
            className="rounded-lg"
          />
          <div className="pr-1">
            <p className="text-xs font-bold text-text-primary leading-tight">Kitchen</p>
            <p className="text-2xs text-text-muted leading-tight">Covina, CA</p>
          </div>
        </div>
      </m.div>

      {/* Bottom info bar */}
      <AnimatePresence mode="wait">
        <m.div
          key={hasDestination ? "route" : "default"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <div
            className={cn(
              "px-4 py-3 rounded-xl sm:backdrop-blur-md",
              "shadow-lg ring-1",
              hasDestination
                ? isValid
                  ? "bg-green/10 ring-green/30"
                  : "bg-status-error/10 ring-status-error/30"
                : "bg-surface-primary/95 ring-border/30"
            )}
          >
            {hasDestination ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isValid ? "bg-green/20" : "bg-status-error/20"
                    )}
                  >
                    <Navigation2
                      className={cn(
                        "w-5 h-5",
                        isValid ? "text-green" : "text-status-error"
                      )}
                    />
                  </m.div>
                  <div>
                    <p className={cn(
                      "font-display font-bold text-lg leading-tight",
                      isValid ? "text-green" : "text-status-error"
                    )}>
                      {distanceMiles?.toFixed(1) ?? "0"} miles
                    </p>
                    <p className="text-xs text-text-muted">
                      ~{durationMinutes ?? 0} min drive time
                    </p>
                  </div>
                </div>
                <m.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {isValid ? (
                    <span className="px-3 py-1.5 rounded-full bg-green/20 text-green text-sm font-bold">
                      {"\u2713"} In Range
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-status-error/20 text-status-error text-sm font-bold">
                      {"\u2717"} Too Far
                    </span>
                  )}
                </m.div>
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-center py-1">
                <m.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: 5 }}
                >
                  <MapPin className="w-5 h-5 text-primary" />
                </m.div>
                <p className="text-sm text-text-secondary font-medium">
                  Enter your address to check if we deliver to you
                </p>
              </div>
            )}
          </div>
        </m.div>
      </AnimatePresence>
    </>
  );
}
