"use client";

import { Truck, StickyNote, Clock, Route } from "lucide-react";
import { format, parseISO } from "date-fns";
import { CollapsibleCard } from "../OrderDetailPage/CollapsibleCard";
import type { DeliveryInfo } from "../OrderDetailPage/types";

interface DeliveryInfoCardProps {
  deliveryInfo: DeliveryInfo | null;
}

function formatTimestamp(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy h:mm a");
}

export function DeliveryInfoCard({ deliveryInfo }: DeliveryInfoCardProps) {
  if (!deliveryInfo) return null;

  const hasNotes = deliveryInfo.deliveryNotes || deliveryInfo.deliveryInstructions;
  const hasTimestamps = deliveryInfo.arrivedAt || deliveryInfo.deliveredAt;
  const hasRoute = deliveryInfo.routeId;

  return (
    <CollapsibleCard title="Delivery Info" icon={<Truck className="h-4 w-4" />} defaultOpen>
      <div className="space-y-3 text-sm">
        {/* Delivery notes from route_stops */}
        {deliveryInfo.deliveryNotes && (
          <div className="flex items-start gap-2">
            <StickyNote className="h-4 w-4 mt-0.5 flex-shrink-0 text-text-muted" />
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Driver Notes
              </span>
              <p className="text-text-secondary mt-0.5">{deliveryInfo.deliveryNotes}</p>
            </div>
          </div>
        )}

        {/* Delivery instructions from order */}
        {deliveryInfo.deliveryInstructions && (
          <div className="flex items-start gap-2">
            <StickyNote className="h-4 w-4 mt-0.5 flex-shrink-0 text-text-muted" />
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Customer Instructions
              </span>
              <p className="text-text-secondary mt-0.5">{deliveryInfo.deliveryInstructions}</p>
            </div>
          </div>
        )}

        {/* Route assignment */}
        {hasRoute && (
          <div className="flex items-start gap-2">
            <Route className="h-4 w-4 mt-0.5 flex-shrink-0 text-text-muted" />
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Route
              </span>
              <p className="text-text-secondary mt-0.5">
                {deliveryInfo.routeId?.slice(0, 8).toUpperCase()}
                {deliveryInfo.routeStatus && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-muted">
                    {deliveryInfo.routeStatus}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        {hasTimestamps && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-text-muted" />
            <div className="space-y-1">
              {deliveryInfo.arrivedAt && (
                <p className="text-text-secondary">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Arrived:{" "}
                  </span>
                  {formatTimestamp(deliveryInfo.arrivedAt)}
                </p>
              )}
              {deliveryInfo.deliveredAt && (
                <p className="text-text-secondary">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Delivered:{" "}
                  </span>
                  {formatTimestamp(deliveryInfo.deliveredAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasNotes && !hasTimestamps && !hasRoute && (
          <p className="text-text-muted italic">No delivery details available yet.</p>
        )}
      </div>
    </CollapsibleCard>
  );
}
