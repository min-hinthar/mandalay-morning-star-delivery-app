"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

// ============================================
// SYNC STATUS TYPES
// ============================================

type SyncStatus = "idle" | "saving" | "saved";

// ============================================
// CART HEADER — editorial masthead (After Dark)
// ============================================

interface CartHeaderProps {
  itemCount: number;
  onClose: () => void;
  onClearClick: () => void;
  showClear: boolean;
}

export function CartHeader({ itemCount, onClose, onClearClick, showClear }: CartHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { items } = useCart();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const isFirstRender = useRef(true);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track cart item changes for sync indicator
  useEffect(() => {
    // Skip first render to avoid showing "Saved" on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear existing timers
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    // Show "Saving..." briefly
    setSyncStatus("saving");

    // After 500ms, switch to "Saved"
    savingTimerRef.current = setTimeout(() => {
      setSyncStatus("saved");

      // After 2s, hide indicator
      savedTimerRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    }, 500);

    return () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [items]);

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <HeroSunburst className="h-5 w-5 shrink-0 text-hero-clay" rays={8} />
        <div className="min-w-0 leading-tight">
          <h2
            id="cart-drawer-title"
            className="font-display text-lg font-semibold text-text-primary"
          >
            Your cart
          </h2>
          <span className="font-burmese text-2xs text-text-muted" lang="my">
            သင့်ခြင်း
            {itemCount > 0 ? ` · ${itemCount} ခု` : ""}
          </span>
        </div>

        {itemCount > 0 && (
          <m.span
            key={itemCount}
            initial={shouldAnimate ? { scale: 0, rotate: -10 } : undefined}
            animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
            transition={getSpring(spring.rubbery)}
            className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-2xs font-bold text-text-secondary"
          >
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </m.span>
        )}

        {/* Sync status indicator */}
        <AnimatePresence>
          {syncStatus !== "idle" && (
            <m.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex shrink-0 items-center gap-1 text-2xs text-text-muted"
            >
              {syncStatus === "saving" ? (
                "Saving…"
              ) : (
                <>
                  <Check className="h-3 w-3 text-hero-sage" />
                  Saved
                </>
              )}
            </m.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showClear && (
          <m.button
            type="button"
            onClick={onClearClick}
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "text-text-muted hover:bg-status-error/10 hover:text-status-error",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error focus-visible:ring-offset-2"
            )}
            aria-label="Clear cart"
          >
            <Trash2 className="h-5 w-5" />
          </m.button>
        )}

        <m.button
          type="button"
          onClick={onClose}
          whileHover={shouldAnimate ? { scale: 1.05, rotate: 90 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          transition={getSpring(spring.snappy)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "text-text-muted hover:bg-surface-secondary hover:text-text-primary",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          aria-label="Close cart"
        >
          <X className="h-5 w-5" />
        </m.button>
      </div>
    </div>
  );
}

export default CartHeader;
