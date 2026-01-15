"use client";

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
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-lg font-bold text-white">
          {stopIndex}
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-charcoal">
            {customer.fullName || "Customer"}
          </h1>
          <p className="text-sm text-charcoal/60">Stop #{stopIndex}</p>
        </div>
      </div>

      {/* Contact */}
      {customer.phone && (
        <button
          onClick={handleCall}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-warm-sm",
            "transition-all hover:shadow-warm-md active:scale-[0.99]"
          )}
          data-testid="call-button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-jade-100">
            <Phone className="h-5 w-5 text-jade-600" />
          </div>
          <div className="text-left">
            <p className="text-sm text-charcoal/60">Phone</p>
            <p className="font-medium text-charcoal">{customer.phone}</p>
          </div>
        </button>
      )}

      {/* Address */}
      <div className="rounded-xl bg-white p-4 shadow-warm-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-100">
            <MapPin className="h-5 w-5 text-saffron-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-charcoal/60">Delivery Address</p>
            <p className="font-medium text-charcoal">{address.line1}</p>
            {address.line2 && (
              <p className="text-charcoal/80">{address.line2}</p>
            )}
            <p className="text-charcoal/80">
              {address.city}, {address.state} {address.zipCode}
            </p>
          </div>
          <button
            onClick={copyAddress}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              copied ? "bg-jade-100 text-jade-600" : "bg-charcoal-100 text-charcoal/60 hover:bg-charcoal-200"
            )}
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Time Window */}
      {timeDisplay && (
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-warm-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal-100">
            <Clock className="h-5 w-5 text-charcoal/60" />
          </div>
          <div>
            <p className="text-sm text-charcoal/60">Delivery Window</p>
            <p className="font-medium text-charcoal">{timeDisplay}</p>
          </div>
        </div>
      )}

      {/* Delivery Notes */}
      {deliveryNotes && (
        <div className="rounded-xl bg-saffron-50 p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 shrink-0 text-saffron-600" />
            <div>
              <p className="text-sm font-medium text-saffron-700">
                Delivery Notes
              </p>
              <p className="mt-1 text-saffron-800">{deliveryNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-warm-sm">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-charcoal/60" />
            <h2 className="font-semibold text-charcoal">
              Order ({orderItems.length} {orderItems.length === 1 ? "item" : "items"})
            </h2>
          </div>
          <ul className="space-y-2">
            {orderItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between border-b border-charcoal/10 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    {item.quantity}x {item.name}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-sm text-charcoal/60">
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
