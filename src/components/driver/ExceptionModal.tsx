"use client";

import { useState } from "react";
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={handleClose}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-t-2xl bg-surface-primary sm:rounded-2xl",
          "max-h-[90vh] overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-v5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-error" />
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Report Exception
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-tertiary"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: "60vh" }}>
          <p className="mb-4 text-sm text-text-secondary">
            Select the reason why this delivery cannot be completed.
          </p>

          {/* Exception Type Selection */}
          <div className="space-y-2">
            {EXCEPTION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-xl border-2 p-3 text-left transition-all",
                  selectedType === type.value
                    ? "border-status-error bg-status-error-bg"
                    : "border-border-v5 bg-surface-primary hover:border-border-v5-strong"
                )}
              >
                <p className="font-medium text-text-primary">{type.label}</p>
                <p className="text-sm text-text-secondary">{type.description}</p>
              </button>
            ))}
          </div>

          {/* Additional Description */}
          {selectedType && (
            <div className="mt-4">
              <label
                htmlFor="exception-description"
                className="mb-2 block text-sm font-medium text-text-primary"
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
                  "w-full rounded-xl border border-border-v5 p-3 text-text-primary",
                  "placeholder:text-text-secondary/60",
                  "focus:border-status-success focus:outline-none focus:ring-2 focus:ring-status-success/20",
                  "disabled:bg-surface-tertiary"
                )}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="mt-3 text-center text-sm text-status-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-v5 p-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || isSubmitting}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-xl font-semibold",
              "bg-status-error text-text-inverse",
              "transition-all hover:bg-accent-tertiary-hover",
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
      </div>
    </div>
  );
}
