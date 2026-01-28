/**
 * V6 Stop Detail Component - Pepper Aesthetic
 *
 * Full stop information display with progress, contact, address, and order items.
 * V6 colors, typography, and high-contrast support.
 */

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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between font-body text-sm">
          <span className="font-semibold text-text-primary">
            Stop {stopIndex} of {totalStops}
          </span>
          <span className="font-medium text-green">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-green"
          />
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-3"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-text-primary font-body text-lg font-bold text-text-inverse">
          {stopIndex}
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary">
            {customer.fullName || "Customer"}
          </h1>
          <p className="font-body text-sm text-text-muted">Stop #{stopIndex}</p>
        </div>
      </motion.div>

      {/* Contact */}
      {customer.phone && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleCall}
          className={cn(
            "flex w-full items-center gap-3 rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border",
            "transition-all duration-fast hover:shadow-md active:scale-[0.99]"
          )}
          data-testid="call-button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/10">
            <Phone className="h-5 w-5 text-green" />
          </div>
          <div className="text-left">
            <p className="font-body text-sm text-text-muted">Phone</p>
            <p className="font-body font-medium text-text-primary">{customer.phone}</p>
          </div>
        </motion.button>
      )}

      {/* Address */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm text-text-muted">Delivery Address</p>
            <p className="font-body font-medium text-text-primary">{address.line1}</p>
            {address.line2 && (
              <p className="font-body text-text-secondary">{address.line2}</p>
            )}
            <p className="font-body text-text-secondary">
              {address.city}, {address.state} {address.zipCode}
            </p>
          </div>
          <button
            onClick={copyAddress}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-input transition-colors duration-fast",
              copied
                ? "bg-green/10 text-green"
                : "bg-surface-tertiary text-text-muted hover:bg-surface-secondary"
            )}
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Time Window */}
      {timeDisplay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tertiary">
            <Clock className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <p className="font-body text-sm text-text-muted">Delivery Window</p>
            <p className="font-body font-medium text-text-primary">{timeDisplay}</p>
          </div>
        </motion.div>
      )}

      {/* Delivery Notes - V6 warning style */}
      {deliveryNotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-card-sm border-l-4 border-secondary bg-secondary/10 p-4"
        >
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 shrink-0 text-secondary-hover" />
            <div>
              <p className="font-body text-sm font-medium text-secondary-hover">
                Delivery Notes
              </p>
              <p className="mt-1 font-body text-text-primary">{deliveryNotes}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Order Items */}
      {orderItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
        >
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-text-muted" />
            <h2 className="font-body font-semibold text-text-primary">
              Order ({orderItems.length} {orderItems.length === 1 ? "item" : "items"})
            </h2>
          </div>
          <ul className="space-y-2">
            {orderItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-body font-medium text-text-primary">
                    {item.quantity}x {item.name}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="font-body text-sm text-text-muted">
                      {item.modifiers.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
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
