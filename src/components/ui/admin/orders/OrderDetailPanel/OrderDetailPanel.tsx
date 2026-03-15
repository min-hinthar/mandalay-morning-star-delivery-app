"use client";

import { CustomerContactCard } from "./CustomerContactCard";
import { DeliveryInfoCard } from "./DeliveryInfoCard";
import { OrderItemsCard } from "../OrderDetailPage/OrderItemsCard";
import { TotalsCard } from "../OrderDetailPage/TotalsCard";
import { PaymentInfoCard } from "../OrderDetailPage/PaymentInfoCard";
import { CustomerInfoCard } from "../OrderDetailPage/CustomerInfoCard";
import type { OrderDetailPanelProps } from "./types";

export function OrderDetailPanel({ order }: OrderDetailPanelProps) {
  return (
    <div>
      {/* Prominent contact at top */}
      <CustomerContactCard order={order} />

      {/* Two-column grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Items + Totals */}
        <div className="space-y-6">
          <OrderItemsCard items={order.items} orderStatus={order.status} />
          <TotalsCard order={order} />
        </div>

        {/* Right: Address + Delivery Info + Payment */}
        <div className="space-y-6">
          <CustomerInfoCard order={order} />
          <DeliveryInfoCard deliveryInfo={order.deliveryInfo} />
          <PaymentInfoCard order={order} />
        </div>
      </div>
    </div>
  );
}
