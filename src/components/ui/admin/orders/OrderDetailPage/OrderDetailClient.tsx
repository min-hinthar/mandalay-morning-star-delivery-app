"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import type { OrderStatus } from "@/types/database";
import type { OrderDetail } from "./types";
import { OrderHeaderCard } from "./OrderHeaderCard";
import { CustomerInfoCard } from "./CustomerInfoCard";
import { OrderItemsCard } from "./OrderItemsCard";
import { TotalsCard } from "./TotalsCard";
import { PaymentInfoCard } from "./PaymentInfoCard";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { StatusTimelineCard } from "./StatusTimelineCard";
import { EmailHistoryCard } from "./EmailHistoryCard";

export function OrderDetailClient() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status change dialog state
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  // Highlight animation class
  const [highlightStatus, setHighlightStatus] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/orders/${orderId}/details`);
      if (res.status === 404) {
        notFound();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractErrorMessage(data, "Failed to fetch order details"));
      }
      const data: OrderDetail = await res.json();
      setOrder(data);
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleStatusAction = (newStatus: OrderStatus) => {
    setPendingStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const handleStatusChanged = (newStatus: OrderStatus) => {
    if (!order) return;
    // Optimistic update
    setOrder({ ...order, status: newStatus });
    setStatusDialogOpen(false);
    setPendingStatus(null);
    // Highlight animation
    setHighlightStatus(true);
    setTimeout(() => setHighlightStatus(false), 1000);
  };

  const handleStatusFailed = (previousStatus: OrderStatus) => {
    if (!order) return;
    setOrder({ ...order, status: previousStatus });
    toast({
      message: "Reverted to previous status",
      type: "error",
    });
  };

  const handlePriorityChanged = (isPriority: boolean) => {
    if (!order) return;
    setOrder({ ...order, isPriority });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center py-20 text-status-error">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">{error || "Order not found"}</p>
          <Link href="/admin/orders" className="mt-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();

  // Build order summary for manual email footer
  const orderSummary = [
    order.items.map((i) => `${i.name} x${i.quantity}`).join(", "),
    order.address ? `Delivery: ${order.address.street}, ${order.address.city}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="p-8">
      <AdminPageHeader
        title={`Order #${shortId}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: `#${shortId}` },
        ]}
        actions={
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Orders
            </Button>
          </Link>
        }
      />

      {/* Order Header (always visible, not collapsible) */}
      <div className={cn(highlightStatus && "animate-pulse")}>
        <OrderHeaderCard
          order={order}
          onStatusAction={handleStatusAction}
          onPriorityChanged={handlePriorityChanged}
          onContactResolved={() => {
            if (!order) return;
            setOrder({ ...order, needsContact: false });
          }}
        />
      </div>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Items + Totals + Email History */}
        <div className="space-y-6">
          <OrderItemsCard items={order.items} />
          <TotalsCard order={order} />
          <EmailHistoryCard
            orderId={order.id}
            orderNumber={shortId}
            customerEmail={order.customerEmail}
            orderSummary={orderSummary}
          />
        </div>

        {/* Right column: Customer + Status Timeline + Payment */}
        <div className="space-y-6">
          <CustomerInfoCard order={order} />
          <StatusTimelineCard auditLog={order.auditLog} />
          <PaymentInfoCard order={order} />
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      {pendingStatus && (
        <StatusChangeDialog
          open={statusDialogOpen}
          onClose={() => {
            setStatusDialogOpen(false);
            setPendingStatus(null);
          }}
          orderId={order.id}
          currentStatus={order.status}
          newStatus={pendingStatus}
          customerEmail={order.customerEmail}
          onStatusChanged={handleStatusChanged}
          onStatusFailed={handleStatusFailed}
        />
      )}
    </div>
  );
}
