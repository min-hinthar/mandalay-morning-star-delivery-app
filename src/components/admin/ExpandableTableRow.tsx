/**
 * V5 Sprint 4: Expandable Table Row Component
 *
 * Reusable table row with smooth expand/collapse animation.
 * Click row to reveal quick preview panel. Interactive elements
 * (dropdowns, buttons) work independently without triggering expand.
 */

"use client";

import { useState, useCallback, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  MapPin,
  Package,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TableRow, TableCell } from "@/components/ui/table";

// ============================================
// EXPANDABLE TABLE ROW
// ============================================

interface ExpandableTableRowProps {
  /** Unique ID for this row */
  id: string;
  /** Whether this row is currently expanded */
  isExpanded: boolean;
  /** Callback when expand state changes */
  onExpandChange: (id: string, expanded: boolean) => void;
  /** Number of columns in the table (for preview colspan) */
  colSpan: number;
  /** The main row cells content */
  children: ReactNode;
  /** The preview panel content */
  previewContent: ReactNode;
  /** Optional className for the row */
  className?: string;
}

export function ExpandableTableRow({
  id,
  isExpanded,
  onExpandChange,
  colSpan,
  children,
  previewContent,
  className,
}: ExpandableTableRowProps) {
  const handleRowClick = useCallback(
    (e: MouseEvent<HTMLTableRowElement>) => {
      // Don't expand if clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest("button") ||
        target.closest("a") ||
        target.closest('[role="menuitem"]') ||
        target.closest('[data-radix-collection-item]') ||
        target.closest('[data-state]') ||
        target.closest(".dropdown-trigger");

      if (isInteractive) return;

      onExpandChange(id, !isExpanded);
    },
    [id, isExpanded, onExpandChange]
  );

  return (
    <>
      {/* Main Row */}
      <TableRow
        onClick={handleRowClick}
        className={cn(
          "cursor-pointer transition-colors group",
          "hover:bg-surface-secondary/50",
          isExpanded && "bg-surface-secondary border-b-0",
          className
        )}
      >
        {children}
        {/* Expand indicator */}
        <TableCell className="w-8 pr-4">
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-text-secondary group-hover:text-interactive-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </TableCell>
      </TableRow>

      {/* Preview Panel Row */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <tr>
            <td colSpan={colSpan + 1} className="p-0 border-b">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.2, delay: 0.1 },
                }}
                className="overflow-hidden"
              >
                <div className="relative">
                  {/* Left accent border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-interactive-primary via-interactive-primary/60 to-transparent" />

                  {/* Content container */}
                  <div className="pl-6 pr-4 py-4 bg-gradient-to-r from-surface-secondary to-surface-primary">
                    {previewContent}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// QUICK PREVIEW PANEL
// ============================================

interface QuickPreviewPanelProps {
  /** Items list to display */
  items?: Array<{ name: string; quantity: number; price?: number }>;
  /** Delivery address */
  address?: string;
  /** Customer notes */
  notes?: string;
  /** Link to full details page */
  detailsLink: string;
  /** Optional additional sections */
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
      {/* Items Section */}
      {items && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-text-secondary">
            <Package className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Items ({items.length})
            </span>
          </div>
          <ul className="space-y-1.5">
            {items.slice(0, 4).map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-primary">
                  <span className="text-interactive-primary font-medium">
                    {item.quantity}×
                  </span>{" "}
                  {item.name}
                </span>
                {item.price !== undefined && (
                  <span className="text-text-secondary font-mono text-xs">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                )}
              </motion.li>
            ))}
            {items.length > 4 && (
              <li className="text-xs text-text-secondary italic">
                +{items.length - 4} more items
              </li>
            )}
          </ul>
        </motion.div>
      )}

      {/* Address Section */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Delivery Address
            </span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">{address}</p>
        </motion.div>
      )}

      {/* Notes Section */}
      {notes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-text-secondary">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Customer Notes
            </span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed italic bg-surface-tertiary/50 rounded-lg px-3 py-2 border-l-2 border-interactive-primary/30">
            "{notes}"
          </p>
        </motion.div>
      )}

      {/* Additional sections */}
      {children}

      {/* View Full Details Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="md:col-span-3 flex justify-end pt-2"
      >
        <Link
          href={detailsLink}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-surface-tertiary hover:bg-interactive-primary-light",
            "text-text-secondary hover:text-interactive-primary",
            "border border-transparent hover:border-interactive-primary/30",
            "transition-all duration-200 group/link"
          )}
        >
          View Full Details
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </motion.div>
    </div>
  );
}

// ============================================
// HOOK FOR MANAGING EXPANDED STATE
// ============================================

export function useExpandedRows() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleExpandChange = useCallback((id: string, expanded: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (expanded) {
        // Only allow one row expanded at a time
        next.clear();
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (id: string) => expandedIds.has(id),
    [expandedIds]
  );

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return {
    expandedIds,
    handleExpandChange,
    isExpanded,
    collapseAll,
  };
}

// ============================================
// ROUTE-SPECIFIC PREVIEW
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

export function RoutePreviewPanel({
  stops,
  estimatedDuration,
  detailsLink,
}: RoutePreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stops Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-text-secondary">
          <MapPin className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Route Stops ({stops.length})
          </span>
        </div>
        <ul className="space-y-2">
          {stops.slice(0, 3).map((stop, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex items-start gap-3 text-sm"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-interactive-primary-light text-interactive-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate">{stop.customerName}</p>
                <p className="text-xs text-text-secondary truncate">
                  {stop.address}
                </p>
              </div>
            </motion.li>
          ))}
          {stops.length > 3 && (
            <li className="text-xs text-text-secondary italic pl-8">
              +{stops.length - 3} more stops
            </li>
          )}
        </ul>
      </motion.div>

      {/* Duration & Action */}
      <div className="flex flex-col justify-between">
        {estimatedDuration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-text-secondary"
          >
            Est. Duration:{" "}
            <span className="font-medium text-text-primary">
              {estimatedDuration}
            </span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end mt-4"
        >
          <Link
            href={detailsLink}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-surface-tertiary hover:bg-interactive-primary-light",
              "text-text-secondary hover:text-interactive-primary",
              "border border-transparent hover:border-interactive-primary/30",
              "transition-all duration-200 group/link"
            )}
          >
            View Route Details
            <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// DRIVER-SPECIFIC PREVIEW
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
      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Contact
        </span>
        <div className="space-y-1 text-sm">
          <p className="text-text-primary">{email}</p>
          {phone && <p className="text-text-secondary">{phone}</p>}
        </div>
      </motion.div>

      {/* Vehicle Info */}
      {vehicleInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Vehicle
          </span>
          <div className="space-y-1 text-sm">
            <p className="text-text-primary">{vehicleInfo}</p>
            {licensePlate && (
              <p className="font-mono text-xs text-text-secondary bg-surface-tertiary px-2 py-0.5 rounded inline-block">
                {licensePlate}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Performance
        </span>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-interactive-primary font-bold">
              {recentDeliveries}
            </span>{" "}
            <span className="text-text-secondary">deliveries</span>
          </div>
          {rating !== undefined && (
            <div>
              <span className="text-interactive-primary font-bold">
                {rating.toFixed(1)}
              </span>{" "}
              <span className="text-text-secondary">★</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* View Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="md:col-span-3 flex justify-end pt-2"
      >
        <Link
          href={detailsLink}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-surface-tertiary hover:bg-interactive-primary-light",
            "text-text-secondary hover:text-interactive-primary",
            "border border-transparent hover:border-interactive-primary/30",
            "transition-all duration-200 group/link"
          )}
        >
          View Driver Profile
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </motion.div>
    </div>
  );
}
