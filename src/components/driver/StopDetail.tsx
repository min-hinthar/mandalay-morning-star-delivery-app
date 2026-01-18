"use client";

import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Copy, Package, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { NavigationButton } from "./NavigationButton";
import { DeliveryActions } from "./DeliveryActions";
import type { RouteStopStatus } from "@/types/driver";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
}

interface StopDetailProps {
  routeId: string;
  stopId: string;
  stopIndex: number;
  totalStops: number;
  status: RouteStopStatus;
  customer: {
    fullName: string | null;
    phone: string | null;
  };
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;
  };
  timeWindow: {
    start: string | null;
    end: string | null;
  };
  deliveryNotes: string | null;
  orderItems: OrderItem[];
  onStatusChange?: (newStatus: RouteStopStatus) => void;
  onException?: () => void;
}

export function StopDetail({
  routeId,
  stopId,
  stopIndex,
  totalStops,
  status,
  customer,
  address,
  timeWindow,
  deliveryNotes,
  orderItems,
  onStatusChange,
  onException,
}: StopDetailProps) {
  const [copied, setCopied] = useState(false);

  // Calculate progress
  const progressPercent = Math.round((stopIndex / totalStops) * 100);

  // Format time window
  const formatTime = (isoString: string | null): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const timeDisplay =
    timeWindow.start && timeWindow.end
      ? `${formatTime(timeWindow.start)} - ${formatTime(timeWindow.end)}`
      : null;

  // Format full address
  const fullAddress = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zipCode}`,
  ]
    .filter(Boolean)
    .join(", ");

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  };

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--color-text-primary)]">
            Stop {stopIndex} of {totalStops}
          </span>
          <span className="font-medium text-[var(--color-accent-secondary)]">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-[var(--color-accent-secondary)]"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-lg font-bold text-white">
          {stopIndex}
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
            {customer.fullName || "Customer"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">Stop #{stopIndex}</p>
        </div>
      </div>

      {/* Contact */}
      {customer.phone && (
        <button
          onClick={handleCall}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]",
            "transition-all hover:shadow-[var(--shadow-md)] active:scale-[0.99]"
          )}
          data-testid="call-button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-status-success-bg)]">
            <Phone className="h-5 w-5 text-[var(--color-accent-secondary)]" />
          </div>
          <div className="text-left">
            <p className="text-sm text-[var(--color-text-muted)]">Phone</p>
            <p className="font-medium text-[var(--color-text-primary)]">{customer.phone}</p>
          </div>
        </button>
      )}

      {/* Address */}
      <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-interactive-primary-light)]">
            <MapPin className="h-5 w-5 text-[var(--color-interactive-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--color-text-muted)]">Delivery Address</p>
            <p className="font-medium text-[var(--color-text-primary)]">{address.line1}</p>
            {address.line2 && (
              <p className="text-[var(--color-text-secondary)]">{address.line2}</p>
            )}
            <p className="text-[var(--color-text-secondary)]">
              {address.city}, {address.state} {address.zipCode}
            </p>
          </div>
          <button
            onClick={copyAddress}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              copied
                ? "bg-[var(--color-status-success-bg)] text-[var(--color-accent-secondary)]"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
            )}
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Time Window */}
      {timeDisplay && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-muted)]">
            <Clock className="h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Delivery Window</p>
            <p className="font-medium text-[var(--color-text-primary)]">{timeDisplay}</p>
          </div>
        </div>
      )}

      {/* Delivery Notes - V3 warning style */}
      {deliveryNotes && (
        <div className="rounded-xl border-l-4 border-[var(--color-status-warning)] bg-[var(--color-status-warning-bg)] p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 shrink-0 text-[var(--color-status-warning)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-status-warning)]">
                Delivery Notes
              </p>
              <p className="mt-1 text-[var(--color-status-warning)]">{deliveryNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--color-text-muted)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Order ({orderItems.length} {orderItems.length === 1 ? "item" : "items"})
            </h2>
          </div>
          <ul className="space-y-2">
            {orderItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {item.quantity}x {item.name}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {item.modifiers.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Button */}
      {address.latitude && address.longitude && (
        <NavigationButton
          latitude={address.latitude}
          longitude={address.longitude}
          address={fullAddress}
          className="w-full"
        />
      )}

      {/* Delivery Actions */}
      <DeliveryActions
        routeId={routeId}
        stopId={stopId}
        currentStatus={status}
        onStatusChange={onStatusChange}
        onException={onException}
      />
    </div>
  );
}
