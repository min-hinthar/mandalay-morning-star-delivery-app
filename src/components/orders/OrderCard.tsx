"use client";

import Link from "next/link";
import { ChevronRight, Package, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import type { OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order";

interface OrderCardProps {
  order: {
    id: string;
    status: OrderStatus;
    totalCents: number;
    deliveryWindowStart: string | null;
    placedAt: string;
    itemCount: number;
  };
  index?: number;
}

export function OrderCard({ order, index = 0 }: OrderCardProps) {
  const deliveryDate = order.deliveryWindowStart
    ? format(parseISO(order.deliveryWindowStart), "EEEE, MMM d")
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/orders/${order.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-curry/10 p-2">
                  <Package className="h-5 w-5 text-curry" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} &middot;{" "}
                    {format(parseISO(order.placedAt), "MMM d, yyyy")}
                  </p>
                  {deliveryDate && (
                    <p className="text-sm text-muted-foreground">
                      Delivery: {deliveryDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-charcoal">
                    {formatPrice(order.totalCents)}
                  </p>
                  <Badge className={ORDER_STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  {order.status === "pending" && (
                    <p className="text-xs text-amber-600 flex items-center justify-end gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      Action required
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-charcoal transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
