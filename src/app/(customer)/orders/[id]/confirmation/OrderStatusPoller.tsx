"use client";

import { useEffect, useRef, useState } from "react";
import { OrderConfirmationV8 } from "@/components/ui/orders/OrderConfirmationV8";
import type { Order } from "@/types/order";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 8;
const VERIFY_AFTER_POLLS = 4;

interface OrderStatusPollerProps {
  order: Order;
  sessionId: string | null;
}

export function OrderStatusPoller({ order, sessionId }: OrderStatusPollerProps) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const pollCount = useRef(0);
  const verified = useRef(false);

  useEffect(() => {
    // Only poll if pending
    if (currentStatus !== "pending" || !sessionId) return;

    const interval = setInterval(async () => {
      pollCount.current += 1;

      // Try verify-payment after 4 polls
      if (pollCount.current >= VERIFY_AFTER_POLLS && !verified.current) {
        verified.current = true;
        try {
          const res = await fetch(`/api/orders/${order.id}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status !== "pending") {
              setCurrentStatus(data.status);
              clearInterval(interval);
              return;
            }
          }
        } catch {
          // Ignore — will keep polling
        }
      }

      // Poll status
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "pending") {
            setCurrentStatus(data.status);
            clearInterval(interval);
            return;
          }
        }
      } catch {
        // Ignore — will retry on next interval
      }

      // Stop after max polls
      if (pollCount.current >= MAX_POLLS) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [currentStatus, order.id, sessionId]);

  // Show reassurance message while pending
  if (currentStatus === "pending") {
    return (
      <div>
        <OrderConfirmationV8 order={order} />
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-toast">
          <div className="bg-surface-secondary text-text-primary rounded-lg px-4 py-2 shadow-lg text-sm">
            Payment received — confirming your order...
          </div>
        </div>
      </div>
    );
  }

  // Status updated — render with confirmed order
  return <OrderConfirmationV8 order={{ ...order, status: currentStatus }} />;
}
