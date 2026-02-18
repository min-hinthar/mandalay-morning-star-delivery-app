"use client";

/**
 * Preview Panel Components
 *
 * QuickPreviewPanel, RoutePreviewPanel, DriverPreviewPanel
 * Content panels for expanded table rows.
 */

import { type ReactNode } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { MapPin, Package, MessageSquare, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ============================================
// QUICK PREVIEW PANEL
// ============================================

interface QuickPreviewPanelProps {
  items?: Array<{ name: string; quantity: number; price?: number }>;
  address?: string;
  notes?: string;
  detailsLink: string;
  children?: ReactNode;
}

export function QuickPreviewPanel({
  items,
  address,
  notes,
  detailsLink,
  children,
}: QuickPreviewPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items && items.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-text-muted">
            <Package className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">
              Items ({items.length})
            </span>
          </div>
          <ul className="space-y-1.5">
            {items.slice(0, 4).map((item, i) => (
              <m.li
                key={`${item.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="flex items-center justify-between text-sm font-body"
              >
                <span className="text-text-primary">
                  <span className="text-primary font-medium">{item.quantity}x</span> {item.name}
                </span>
                {item.price !== undefined && (
                  <span className="text-text-muted font-mono text-xs">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                )}
              </m.li>
            ))}
            {items.length > 4 && (
              <li className="text-xs font-body text-text-muted italic">
                +{items.length - 4} more items
              </li>
            )}
          </ul>
        </m.div>
      )}

      {address && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-text-muted">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">
              Delivery Address
            </span>
          </div>
          <p className="text-sm font-body text-text-primary leading-relaxed">{address}</p>
        </m.div>
      )}

      {notes && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-text-muted">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">
              Customer Notes
            </span>
          </div>
          <p className="text-sm font-body text-text-primary leading-relaxed italic bg-surface-tertiary/50 rounded-input px-3 py-2 border-l-2 border-primary/30">
            &ldquo;{notes}&rdquo;
          </p>
        </m.div>
      )}

      {children}

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="md:col-span-3 flex justify-end pt-2"
      >
        <Link
          href={detailsLink}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-input text-sm font-body font-medium",
            "bg-surface-tertiary hover:bg-primary-light",
            "text-text-secondary hover:text-primary",
            "border border-transparent hover:border-primary/30",
            "transition-all duration-fast group/link"
          )}
        >
          View Full Details
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </m.div>
    </div>
  );
}

// ============================================
// ROUTE PREVIEW PANEL
// ============================================

interface RoutePreviewProps {
  stops: Array<{
    address: string;
    customerName: string;
    status: string;
  }>;
  estimatedDuration?: string;
  detailsLink: string;
}

export function RoutePreviewPanel({ stops, estimatedDuration, detailsLink }: RoutePreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-text-muted">
          <MapPin className="h-4 w-4" />
          <span className="text-xs font-body font-semibold uppercase tracking-wider">
            Route Stops ({stops.length})
          </span>
        </div>
        <ul className="space-y-2">
          {stops.slice(0, 3).map((stop, i) => (
            <m.li
              key={`${stop.address}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex items-start gap-3 text-sm font-body"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate">{stop.customerName}</p>
                <p className="text-xs text-text-muted truncate">{stop.address}</p>
              </div>
            </m.li>
          ))}
          {stops.length > 3 && (
            <li className="text-xs font-body text-text-muted italic pl-8">
              +{stops.length - 3} more stops
            </li>
          )}
        </ul>
      </m.div>

      <div className="flex flex-col justify-between">
        {estimatedDuration && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm font-body text-text-secondary"
          >
            Est. Duration:{" "}
            <span className="font-medium text-text-primary">{estimatedDuration}</span>
          </m.div>
        )}

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end mt-4"
        >
          <Link
            href={detailsLink}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-input text-sm font-body font-medium",
              "bg-surface-tertiary hover:bg-primary-light",
              "text-text-secondary hover:text-primary",
              "border border-transparent hover:border-primary/30",
              "transition-all duration-fast group/link"
            )}
          >
            View Route Details
            <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </m.div>
      </div>
    </div>
  );
}

// ============================================
// DRIVER PREVIEW PANEL
// ============================================

interface DriverPreviewProps {
  email: string;
  phone?: string;
  vehicleInfo?: string;
  licensePlate?: string;
  recentDeliveries: number;
  rating?: number;
  detailsLink: string;
}

export function DriverPreviewPanel({
  email,
  phone,
  vehicleInfo,
  licensePlate,
  recentDeliveries,
  rating,
  detailsLink,
}: DriverPreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-text-muted">
          Contact
        </span>
        <div className="space-y-1 text-sm font-body">
          <p className="text-text-primary">{email}</p>
          {phone && <p className="text-text-secondary">{phone}</p>}
        </div>
      </m.div>

      {vehicleInfo && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <span className="text-xs font-body font-semibold uppercase tracking-wider text-text-muted">
            Vehicle
          </span>
          <div className="space-y-1 text-sm font-body">
            <p className="text-text-primary">{vehicleInfo}</p>
            {licensePlate && (
              <p className="font-mono text-xs text-text-muted bg-surface-tertiary px-2 py-0.5 rounded-input inline-block">
                {licensePlate}
              </p>
            )}
          </div>
        </m.div>
      )}

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-text-muted">
          Performance
        </span>
        <div className="flex items-center gap-4 text-sm font-body">
          <div>
            <span className="text-primary font-bold">{recentDeliveries}</span>{" "}
            <span className="text-text-secondary">deliveries</span>
          </div>
          {rating !== undefined && (
            <div>
              <span className="text-secondary font-bold">{rating.toFixed(1)}</span>{" "}
              <span className="text-secondary">&#9733;</span>
            </div>
          )}
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="md:col-span-3 flex justify-end pt-2"
      >
        <Link
          href={detailsLink}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-input text-sm font-body font-medium",
            "bg-surface-tertiary hover:bg-primary-light",
            "text-text-secondary hover:text-primary",
            "border border-transparent hover:border-primary/30",
            "transition-all duration-fast group/link"
          )}
        >
          View Driver Profile
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </m.div>
    </div>
  );
}
