/**
 * V6 Exception Modal Component - Pepper Aesthetic
 *
 * Exception reporting modal for drivers with V6 styling.
 * Large touch targets (56px), high-contrast support.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DeliveryExceptionType } from "@/types/driver";

const EXCEPTION_TYPES: { value: DeliveryExceptionType; label: string; description: string }[] = [
  {
    value: "customer_not_home",
    label: "Customer Not Home",
    description: "No one available to receive the delivery",
  },
  {
    value: "wrong_address",
    label: "Wrong Address",
    description: "Address doesn't exist or is incorrect",
  },
  {
    value: "access_issue",
    label: "Access Issue",
    description: "Gate code invalid, locked building, etc.",
  },
  {
    value: "refused_delivery",
    label: "Refused Delivery",
    description: "Customer declined to accept the order",
  },
  {
    value: "damaged_order",
    label: "Damaged Order",
    description: "Order was damaged during transit",
  },
  {
    value: "other",
    label: "Other",
    description: "Another issue not listed above",
  },
];

interface ExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  stopId: string;
  onSuccess?: () => void;
}

export function ExceptionModal({
  isOpen,
  onClose,
  routeId,
  stopId,
  onSuccess,
}: ExceptionModalProps) {
  const [selectedType, setSelectedType] = useState<DeliveryExceptionType | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/driver/routes/${routeId}/stops/${stopId}/exception`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: selectedType,
            description: description.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to report exception");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType(null);
      setDescription("");
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "w-full max-w-md rounded-t-v6-card bg-v6-surface-primary sm:rounded-v6-card",
              "max-h-[90vh] overflow-hidden shadow-v6-lg"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-v6-border p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-v6-status-error/10">
                  <AlertTriangle className="h-5 w-5 text-v6-status-error" />
                </div>
                <h2 className="font-v6-display text-lg font-semibold text-v6-text-primary">
                  Report Issue
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "transition-colors duration-v6-fast",
                  "hover:bg-v6-surface-tertiary"
                )}
              >
                <X className="h-5 w-5 text-v6-text-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: "60vh" }}>
              <p className="mb-4 font-v6-body text-sm text-v6-text-secondary">
                Select the reason why this delivery cannot be completed.
              </p>

              {/* Exception Type Selection */}
              <div className="space-y-2">
                {EXCEPTION_TYPES.map((type, index) => (
                  <motion.button
                    key={type.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedType(type.value)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full rounded-v6-card-sm border-2 p-4 text-left",
                      "transition-all duration-v6-fast",
                      "min-h-[56px]", // Driver touch target
                      selectedType === type.value
                        ? "border-v6-status-error bg-v6-status-error/5"
                        : "border-v6-border bg-v6-surface-primary hover:border-v6-text-muted"
                    )}
                  >
                    <p className="font-v6-body font-medium text-v6-text-primary">{type.label}</p>
                    <p className="font-v6-body text-sm text-v6-text-secondary">{type.description}</p>
                  </motion.button>
                ))}
              </div>

              {/* Additional Description */}
              <AnimatePresence>
                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <label
                      htmlFor="exception-description"
                      className="mb-2 block font-v6-body text-sm font-medium text-v6-text-primary"
                    >
                      Additional Details (optional)
                    </label>
                    <textarea
                      id="exception-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add any additional details..."
                      rows={3}
                      maxLength={1000}
                      disabled={isSubmitting}
                      className={cn(
                        "w-full rounded-v6-input border border-v6-border p-3",
                        "font-v6-body text-v6-text-primary",
                        "placeholder:text-v6-text-muted",
                        "focus:border-v6-primary focus:outline-none focus:ring-2 focus:ring-v6-primary/20",
                        "disabled:bg-v6-surface-tertiary",
                        "transition-colors duration-v6-fast"
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 text-center font-v6-body text-sm text-v6-status-error"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-v6-border p-4">
              <button
                onClick={handleSubmit}
                disabled={!selectedType || isSubmitting}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-2 rounded-v6-card-sm",
                  "font-v6-body font-semibold",
                  "bg-v6-status-error text-white shadow-v6-sm",
                  "transition-all duration-v6-fast",
                  "hover:bg-v6-status-error/90 hover:shadow-v6-md",
                  "active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    <span>Skip This Stop</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
