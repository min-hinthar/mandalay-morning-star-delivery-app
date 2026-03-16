"use client";

import { Phone, MessageSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderDetail } from "../OrderDetailPage/types";

interface CustomerContactCardProps {
  order: Pick<OrderDetail, "customerName" | "customerPhone" | "customerEmail">;
}

export function CustomerContactCard({ order }: CustomerContactCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-primary p-4">
      {/* Customer name — large and prominent */}
      <h2 className="font-display text-lg font-bold text-text-primary">
        {order.customerName || "Guest"}
      </h2>

      {/* Phone with call/SMS actions */}
      {order.customerPhone && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-text-secondary">{order.customerPhone}</span>
          <a
            href={`tel:${order.customerPhone}`}
            className={cn(
              "inline-flex items-center justify-center rounded-input",
              "h-11 w-11 min-h-[44px] min-w-[44px]",
              "bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal",
              "transition-colors duration-fast"
            )}
            aria-label={`Call ${order.customerName || "customer"}`}
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href={`sms:${order.customerPhone}`}
            className={cn(
              "inline-flex items-center justify-center rounded-input",
              "h-11 w-11 min-h-[44px] min-w-[44px]",
              "bg-primary-light hover:bg-primary/20 text-primary",
              "transition-colors duration-fast"
            )}
            aria-label={`Text ${order.customerName || "customer"}`}
          >
            <MessageSquare className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Email */}
      {order.customerEmail && (
        <a
          href={`mailto:${order.customerEmail}`}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          {order.customerEmail}
        </a>
      )}
    </div>
  );
}
