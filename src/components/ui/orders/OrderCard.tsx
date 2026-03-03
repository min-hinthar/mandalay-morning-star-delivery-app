"use client";

import Link from "next/link";
import { ChevronRight, Package, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import { spring, staggerDelay } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useReorder } from "@/lib/hooks/useReorder";
import type { OrderStatus } from "@/types/order";
import type { RefundStatus } from "@/types/database";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order";

const REORDERABLE_STATUSES: OrderStatus[] = ["delivered", "confirmed"];

interface OrderCardProps {
  order: {
    id: string;
    status: OrderStatus;
    refundStatus: RefundStatus;
    totalCents: number;
    deliveryWindowStart: string | null;
    placedAt: string;
    itemCount: number;
  };
  index?: number;
}

export function OrderCard({ order, index = 0 }: OrderCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { reorder, confirmReorder, cancelReorder, isLoading, showConfirmation, cartItemCount } =
    useReorder();

  const deliveryDate = order.deliveryWindowStart
    ? format(parseISO(order.deliveryWindowStart), "EEEE, MMM d")
    : null;

  const canReorder = REORDERABLE_STATUSES.includes(order.status);
  const shortId = order.id.slice(0, 8).toUpperCase();

  // 80ms stagger with 500ms cap per Phase 22 standard
  const delay = staggerDelay(index);
  const springConfig = getSpring(spring.default);

  return (
    <>
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...springConfig, delay }}
        whileHover={shouldAnimate ? { scale: 1.02, y: -4 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      >
        <Link href={`/orders/${order.id}`}>
          <Card
            className={cn(
              "glass-menu-card glow-gradient shadow-colorful",
              "cursor-pointer group",
              "transition-shadow duration-200"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-curry/10 p-2">
                    <Package className="h-5 w-5 text-curry" />
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">Order #{shortId}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} &middot;{" "}
                      {format(parseISO(order.placedAt), "MMM d, yyyy")}
                    </p>
                    {deliveryDate && (
                      <p className="text-sm text-muted-foreground">Delivery: {deliveryDate}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canReorder && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        reorder(order.id);
                      }}
                      aria-label="Reorder"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <div className="text-right">
                    <p className="font-medium text-charcoal">{formatPrice(order.totalCents)}</p>
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    {order.refundStatus !== "none" && (
                      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs mt-1">
                        {order.refundStatus === "partial" ? "Partial Refund" : "Refunded"}
                      </Badge>
                    )}
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
      </m.div>

      <AlertDialog open={showConfirmation} onOpenChange={(open) => !open && cancelReorder()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Replace {cartItemCount} item{cartItemCount !== 1 ? "s" : ""} in cart with order #
              {shortId}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReorder}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmReorder()} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
