/**
 * V6 Stop Detail Component - Pepper Aesthetic
 *
 * Full stop information display with progress, contact, address, and order items.
 * V6 colors, typography, and high-contrast support.
 */

"use client";

import { m } from "framer-motion";
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Copy,
  Package,
  FileText,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
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
  testMode?: boolean;
  photoRequired?: boolean;
  onPhotoPrompt?: () => void;
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
  testMode,
  photoRequired,
  onPhotoPrompt,
}: StopDetailProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Delivery notes state
  const [notes, setNotes] = useState(deliveryNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

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

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  }, [fullAddress]);

  const smsBody = encodeURIComponent(
    "Hi, this is your Morning Star delivery driver. I'm on my way!"
  );

  const notesEditable = status !== "delivered" && status !== "skipped";
  const notesChanged = notes !== (deliveryNotes ?? "");

  const saveNotes = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/driver/routes/${routeId}/stops/${stopId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      toast({ message: "Failed to save notes", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [routeId, stopId, notes]);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between font-body text-sm">
          <span className="font-semibold text-text-primary">
            Stop {stopIndex} of {totalStops}
          </span>
          <span className="font-medium text-green">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-green"
          />
        </div>
      </m.div>

      {/* Header */}
      <m.div
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
      </m.div>

      {/* Contact: Call + SMS */}
      {customer.phone && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <a
            href={`tel:${customer.phone}`}
            className={cn(
              "flex flex-1 min-h-[56px] items-center gap-3 rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border",
              "transition-all duration-fast hover:shadow-md active:scale-[0.99]"
            )}
            data-testid="call-button"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green/10">
              <Phone className="h-5 w-5 text-green" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-body text-sm text-text-muted">Call</p>
              <p className="font-body font-medium text-text-primary truncate">{customer.phone}</p>
            </div>
          </a>
          <a
            href={`sms:${customer.phone}?body=${smsBody}`}
            className={cn(
              "flex min-h-[56px] w-14 items-center justify-center rounded-card-sm bg-surface-primary shadow-sm border border-border",
              "transition-all duration-fast hover:shadow-md active:scale-[0.99]"
            )}
            data-testid="sms-button"
            aria-label="Send SMS"
          >
            <MessageSquare className="h-5 w-5 text-primary" />
          </a>
        </m.div>
      )}

      {/* Address */}
      <m.div
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
            {address.line2 && <p className="font-body text-text-secondary">{address.line2}</p>}
            <p className="font-body text-text-secondary">
              {address.city}, {address.state} {address.zipCode}
            </p>
          </div>
          <button
            onClick={copyAddress}
            className={cn(
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-input transition-colors duration-fast",
              copied
                ? "bg-green/10 text-green"
                : "bg-surface-tertiary text-text-muted hover:bg-surface-secondary"
            )}
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </m.div>

      {/* Time Window */}
      {timeDisplay && (
        <m.div
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
        </m.div>
      )}

      {/* Delivery Notes */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-card-sm bg-surface-primary p-4 shadow-sm border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-text-muted" />
          <p className="font-body text-sm font-medium text-text-primary">Delivery Notes</p>
        </div>
        {notesEditable ? (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Left at door, Gate code 1234"
              maxLength={500}
              rows={2}
              className="w-full rounded-input border border-border bg-surface-secondary p-3 font-body text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="delivery-notes-input"
            />
            {notesChanged && (
              <button
                onClick={saveNotes}
                disabled={saving}
                className={cn(
                  "mt-2 flex items-center gap-2 rounded-input px-4 py-2 font-body text-sm font-medium transition-colors duration-fast",
                  saved
                    ? "bg-green/10 text-green"
                    : "bg-primary text-text-inverse hover:bg-primary-hover active:scale-[0.98]",
                  saving && "opacity-70 cursor-not-allowed"
                )}
                data-testid="save-notes-button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : saved ? "Saved" : "Save Notes"}
              </button>
            )}
          </>
        ) : (
          <p className="font-body text-sm text-text-secondary">{deliveryNotes || "No notes"}</p>
        )}
      </m.div>

      {/* Order Items */}
      {orderItems.length > 0 && (
        <m.div
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
                    <p className="font-body text-sm text-text-muted">{item.modifiers.join(", ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </m.div>
      )}

      {/* Navigation Button - always shown, falls back to address */}
      <NavigationButton
        latitude={address.latitude ?? undefined}
        longitude={address.longitude ?? undefined}
        address={fullAddress}
        className="w-full"
      />

      {/* Delivery Actions */}
      <DeliveryActions
        routeId={routeId}
        stopId={stopId}
        currentStatus={status}
        onStatusChange={onStatusChange}
        onException={onException}
        testMode={testMode}
        photoRequired={photoRequired}
        onPhotoPrompt={onPhotoPrompt}
      />
    </div>
  );
}
