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
}

// ============================================
// COMPONENT
// ============================================

/**
 * Past-cutoff modal with warm, reassuring tone.
 * Cart items are NOT cleared — customers return to browse.
 * Two actions: "Got it" (dismiss) and "Browse Menu" (navigate to /menu).
 */
export function CutoffModal({ isOpen, onClose, nextDeliveryDate }: CutoffModalProps) {
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
        <h2 className="text-xl font-semibold text-text-primary">
          We&apos;re preparing this week&apos;s deliveries!
        </h2>

        {/* Message */}
        <p className="text-text-secondary leading-relaxed">
          Your next chance to order is for{" "}
          <span className="font-medium text-text-primary">{nextDeliveryDate}</span>. We&apos;d love
          to see you then.
        </p>

        {/* Reassurance */}
        <p className="text-sm text-text-muted">Your cart items are saved for next time.</p>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" size="md" onClick={onClose} className="sm:min-w-[120px]">
            Got it
          </Button>
          <Button variant="primary" size="md" asChild className="sm:min-w-[140px]">
            <Link href="/menu" onClick={onClose}>
              Browse Menu
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
