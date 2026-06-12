import Link from "next/link";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/ui/orders/OrderTimeline";
import { PendingOrderActions } from "@/components/ui/orders/PendingOrderActions";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { AfterDarkAmbient } from "@/components/ui/AfterDarkAmbient";
import { AfterDarkSpotlight } from "@/components/ui/AfterDarkSpotlight";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { RatingBanner } from "./RatingBanner";
import { ReorderButton } from "./ReorderButton";
import { OrderShareButton } from "./OrderShareButton";
import { OrderReceiptCard } from "./OrderReceiptCard";
import { OrderStatusCrest } from "./OrderStatusCrest";
import { cn } from "@/lib/utils/cn";
import { format, parseISO } from "date-fns";
import type { Order, OrderItem, OrderAddress } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order";

interface OrderDetailViewProps {
  order: Order;
  address: OrderAddress | null;
  items: OrderItem[];
  deliveryDate: string;
  deliveryTime: string;
  isPastCutoff: boolean;
}

/** Warm "stacked paper" card (cream in both themes — constant ink reads). */
function PaperCard({
  accent = "clay",
  className,
  children,
}: {
  accent?: "clay" | "blue" | "sage";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("hero-surface-paper relative overflow-hidden rounded-2xl", className)}>
      <HeroCardLayers accent={accent} radius="rounded-2xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function OrderDetailView({
  order,
  address,
  items,
  deliveryDate,
  deliveryTime,
  isPastCutoff,
}: OrderDetailViewProps) {
  return (
    <main className="after-dark-canvas relative isolate min-h-screen px-4 pb-20 pt-8">
      {/* Kit living texture + desktop cursor spotlight, behind all content */}
      <AfterDarkAmbient className="-z-10" />
      <AfterDarkSpotlight className="-z-10" />

      <div className="mx-auto max-w-2xl">
        {/* Back + Share — above the fold, instant develop */}
        <div className="animate-hero-develop-1 mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link
              href="/orders"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <OrderShareButton orderId={order.id} />
        </div>

        {/* Rating Banner (delivered orders only) */}
        {order.status === "delivered" && <RatingBanner orderId={order.id} />}

        {/* Editorial order header (on the warm canvas — theme-aware text) */}
        <div className="animate-hero-develop-2 mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HeroSunburst className="mt-1 h-5 w-5 shrink-0 text-hero-clay" rays={8} />
            <div>
              <h1 className="font-display text-2xl text-text-primary">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-text-muted">
                Placed {format(parseISO(order.placedAt), "MMM d, yyyy 'at' h:mm a")}
                <span className="ml-1.5 font-burmese" lang="my">
                  · အော်ဒါ
                </span>
              </p>
            </div>
          </div>
          <Badge className={ORDER_STATUS_COLORS[order.status]}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Order Status — near the fold, instant develop */}
        <div className="animate-hero-develop-3 mb-6">
          <PaperCard accent="clay" className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-hero-ink">
                Order status
                <span
                  className="ml-1.5 font-burmese text-xs font-normal text-hero-ink-muted"
                  lang="my"
                >
                  အခြေအနေ
                </span>
              </h2>
              {/* Tier-tinted crest — morphs from the confirmation wax seal (vt-nav) */}
              <OrderStatusCrest />
            </div>
            <OrderTimeline
              currentStatus={order.status}
              placedAt={order.placedAt}
              confirmedAt={order.confirmedAt}
              deliveredAt={order.deliveredAt}
            />
          </PaperCard>
        </div>

        {/* Delivery Info — staggers in as it scrolls into view */}
        <ScrollReveal className="mb-6 grid gap-4 md:grid-cols-2">
          <PaperCard accent="clay">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-clay/12">
                <Clock className="h-5 w-5 text-hero-clay" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-hero-ink">Delivery time</p>
                <p className="text-sm text-hero-ink-muted">{deliveryDate}</p>
                <p className="text-sm text-hero-ink-muted">{deliveryTime}</p>
              </div>
            </div>
          </PaperCard>

          <PaperCard accent="blue">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-blue/12">
                <MapPin className="h-5 w-5 text-hero-blue" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-hero-ink">Delivery address</p>
                {address ? (
                  <>
                    <p className="text-sm text-hero-ink-muted">{address.line1}</p>
                    <p className="text-sm text-hero-ink-muted">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-hero-ink-muted">Address on file</p>
                )}
                {order.deliveryInstructions && (
                  <p className="mt-2 text-sm italic text-hero-ink-muted">
                    {order.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>
          </PaperCard>
        </ScrollReveal>

        {/* Order Items — living-receipt (tilt + gold-leaf, staggers in) */}
        <ScrollReveal delay={0.06} className="mb-6">
          <OrderReceiptCard order={order} items={items} />
        </ScrollReveal>

        {/* Pending actions */}
        {order.status === "pending" && (
          <ScrollReveal delay={0.1} className="space-y-4">
            <PendingOrderActions orderId={order.id} isPastCutoff={isPastCutoff} />
          </ScrollReveal>
        )}

        {/* Sticky Reorder */}
        <div
          className={cn(
            "sticky bottom-0 z-20 -mx-4 mt-6 flex justify-center",
            "border-t border-border bg-surface-elevated px-4 py-3 shadow-lg"
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <ReorderButton orderId={order.id} />
        </div>
      </div>
    </main>
  );
}
