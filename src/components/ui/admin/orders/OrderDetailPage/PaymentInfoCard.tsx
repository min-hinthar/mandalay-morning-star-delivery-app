"use client";

import { CreditCard, ExternalLink } from "lucide-react";
import { CollapsibleCard } from "./CollapsibleCard";
import type { OrderDetail } from "./types";

interface PaymentInfoCardProps {
  order: OrderDetail;
}

function derivePaymentStatus(status: string): string {
  if (status === "delivered") return "Paid";
  if (status === "cancelled") return "Refunded";
  return "Pending";
}

export function PaymentInfoCard({ order }: PaymentInfoCardProps) {
  const paymentStatus = derivePaymentStatus(order.status);

  return (
    <CollapsibleCard title="Payment" icon={<CreditCard className="h-4 w-4" />} defaultOpen={false}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Status</span>
          <span className="font-medium text-text-primary">{paymentStatus}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Method</span>
          <span className="text-text-primary">Card</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Stripe ID</span>
          {order.stripePaymentIntentId ? (
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent-teal hover:underline font-mono text-xs"
            >
              {order.stripePaymentIntentId.slice(0, 16)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-text-muted">No payment recorded</span>
          )}
        </div>
      </div>
    </CollapsibleCard>
  );
}
