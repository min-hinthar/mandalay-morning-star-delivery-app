"use client";

import { CreditCard, ExternalLink, Banknote, CheckCircle } from "lucide-react";
import { CollapsibleCard } from "./CollapsibleCard";
import type { OrderDetail } from "./types";

interface PaymentInfoCardProps {
  order: OrderDetail;
}

function derivePaymentStatus(order: OrderDetail): string {
  if (order.status === "pending_approval") return "Awaiting Approval";
  if (order.status === "delivered") return "Paid";
  if (order.status === "cancelled") return "Refunded";
  if (order.paymentMethod === "cod" && order.codApprovedAt) return "Approved (COD)";
  return "Pending";
}

export function PaymentInfoCard({ order }: PaymentInfoCardProps) {
  const paymentStatus = derivePaymentStatus(order);
  const isCOD = order.paymentMethod === "cod";
  const icon = isCOD ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />;

  return (
    <CollapsibleCard title="Payment" icon={icon} defaultOpen={isCOD}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Status</span>
          <span className="font-medium text-text-primary">{paymentStatus}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Method</span>
          <span className="text-text-primary">{isCOD ? "Cash on Delivery" : "Card"}</span>
        </div>

        {/* COD-specific info */}
        {isCOD && order.codApprovedAt && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Approved</span>
            <span className="inline-flex items-center gap-1 text-status-success text-xs">
              <CheckCircle className="h-3 w-3" />
              {new Date(order.codApprovedAt).toLocaleString()}
            </span>
          </div>
        )}

        {/* COD pending approval banner */}
        {isCOD && order.status === "pending_approval" && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 font-medium">
              This cash-on-delivery order requires admin approval before being scheduled.
            </p>
          </div>
        )}

        {/* Stripe-specific info */}
        {!isCOD && (
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
        )}
      </div>
    </CollapsibleCard>
  );
}
