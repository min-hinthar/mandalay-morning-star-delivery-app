import React from "react";

import { OrderConfirmation } from "@/emails/OrderConfirmation";
import { OrderCancellation } from "@/emails/OrderCancellation";
import { RefundNotification } from "@/emails/RefundNotification";
import { DeliveryReminder } from "@/emails/DeliveryReminder";

import type { EmailType } from "./types";

/**
 * Build a React email element for the given email type and order data.
 * Centralizes template selection logic for resend, manual trigger, and test routes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildEmailElement(type: EmailType, orderData: any): React.ReactElement {
  switch (type) {
    case "order_confirmation":
      return React.createElement(OrderConfirmation, {
        customerName: orderData.customerName,
        orderId: orderData.orderId,
        items: orderData.items,
        subtotalCents: orderData.subtotalCents,
        deliveryFeeCents: orderData.deliveryFeeCents,
        taxCents: orderData.taxCents,
        tipCents: orderData.tipCents,
        totalCents: orderData.totalCents,
        deliveryWindowStart: orderData.deliveryWindowStart,
        deliveryWindowEnd: orderData.deliveryWindowEnd,
        address: orderData.address,
        specialInstructions: orderData.specialInstructions,
        deliveryInstructions: orderData.deliveryInstructions,
        driverName: orderData.driverName,
        paymentMethod: orderData.paymentMethod,
        dietaryRestrictions: orderData.dietaryRestrictions,
        placedAt: orderData.placedAt,
      });

    case "cancellation":
      return React.createElement(OrderCancellation, {
        customerName: orderData.customerName,
        orderId: orderData.orderId,
        items: orderData.items,
        totalCents: orderData.totalCents,
        cancellationReason: orderData.cancellationReason,
        cancelledAt: orderData.cancelledAt,
        refundIssued: orderData.refundIssued ?? false,
        refundAmountCents: orderData.refundAmountCents,
        refundMethod: orderData.refundMethod,
        refundTimeline: orderData.refundTimeline,
      });

    case "refund":
      return React.createElement(RefundNotification, {
        customerName: orderData.customerName,
        orderId: orderData.orderId,
        isPartialRefund: orderData.isPartialRefund ?? false,
        refundedItems: orderData.refundedItems,
        originalTotalCents: orderData.originalTotalCents,
        refundAmountCents: orderData.refundAmountCents,
        refundMethod: orderData.refundMethod ?? "Original payment method",
        refundTimeline: orderData.refundTimeline ?? "3-5 business days",
        shippingRefundCents: orderData.shippingRefundCents,
        processedAt: orderData.processedAt ?? new Date().toISOString(),
      });

    case "delivery_reminder":
      return React.createElement(DeliveryReminder, {
        customerName: orderData.customerName,
        orderId: orderData.orderId,
        itemCount: orderData.itemCount,
        itemNames: orderData.itemNames,
        deliveryWindowStart: orderData.deliveryWindowStart,
        deliveryWindowEnd: orderData.deliveryWindowEnd,
        address: orderData.address,
        specialInstructions: orderData.specialInstructions,
        driverName: orderData.driverName,
      });

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
