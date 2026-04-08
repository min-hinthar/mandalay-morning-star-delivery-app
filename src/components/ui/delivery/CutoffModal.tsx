"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface CutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextDeliveryDate: string;
  /**
   * Phase 111 CHKP-04 D-27 — When present, renders a primary
   * "Reschedule to {displayDate}" button between "Got it" and
   * "Browse Menu". Button is hidden (D-29) when this is undefined,
   * preserving the legacy two-action layout.
   */
  rescheduleOption?: {
    /** ISO date string for useCheckoutStore.setDelivery (e.g. "2026-04-11") */
    dateString: string;
    /** Display label (e.g. "Saturday, April 11") */
    displayDate: string;
  };
  /** Phase 111 CHKP-04 — invoked when reschedule button clicked. Handler composes setDelivery + setStep + close. */
  onReschedule?: () => void;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Past-cutoff modal with warm, reassuring tone.
 * Cart items are NOT cleared — customers return to browse.
 *
 * Two-action mode (legacy): "Got it" (dismiss) + "Browse Menu" (navigate).
 * Three-action mode (Phase 111 CHKP-04): "Got it" + "Reschedule to {date}"
 * primary CTA + "Browse Menu" outline. Triggered by passing rescheduleOption.
 */
export function CutoffModal({
  isOpen,
  onClose,
  nextDeliveryDate,
  rescheduleOption,
  onReschedule,
}: CutoffModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ordering is currently closed">
      <div className="flex flex-col items-center gap-6 px-2 pb-6 pt-2 text-center">
        {/* Icon */}
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            "bg-amber-100 dark:bg-amber-900/30"
          )}
          aria-hidden="true"
        >
          <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-text-primary">Ordering is currently closed</h2>
        <p className="text-base text-text-secondary -mt-3">မှာယူမှုကို ယာယီပိတ်ထားပါသည်</p>

        {/* Message */}
        <p className="text-text-secondary leading-relaxed">
          Your next chance to order is for{" "}
          <span className="font-medium text-text-primary">{nextDeliveryDate}</span>. We&apos;d love
          to see you then.
        </p>
        <p className="text-sm text-text-muted -mt-3">
          နောက်တစ်ကြိမ် မှာယူနိုင်သည့်ရက်မှာ{" "}
          <span className="font-medium text-text-primary">{nextDeliveryDate}</span> ဖြစ်ပါသည်။
        </p>

        {/* Reassurance */}
        <p className="text-sm text-text-muted">Your cart items are saved for next time.</p>
        <p className="text-xs text-text-muted -mt-3">
          သင့်ဈေးခြင်းထဲရှိ ပစ္စည်းများကို နောက်တစ်ကြိမ်အတွက် သိမ်းဆည်းထားပါသည်။
        </p>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" size="md" onClick={onClose} className="sm:min-w-[120px]">
            Got it
          </Button>

          {/* Phase 111 CHKP-04 — Reschedule button between Got it and Browse Menu */}
          {rescheduleOption && onReschedule && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={onReschedule}
                className="sm:min-w-[160px]"
                aria-label={`Reschedule your delivery to ${rescheduleOption.displayDate}`}
              >
                Reschedule to {rescheduleOption.displayDate}
              </Button>
              {/* BURMESE-REVIEW Phase 111 D-40 — screen-reader-only Burmese label */}
              <span className="sr-only" lang="my">
                {rescheduleOption.displayDate} သို့ ပြောင်းမည်
              </span>
            </>
          )}

          <Button
            variant={rescheduleOption ? "outline" : "primary"}
            size="md"
            asChild
            className="sm:min-w-[140px]"
          >
            <Link href="/menu" onClick={onClose}>
              Browse Menu
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
