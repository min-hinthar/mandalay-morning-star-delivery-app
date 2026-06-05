/**
 * Hero Types
 */

import type { DeliveryDayConfig } from "@/types/delivery";
import type { MenuItem } from "@/types/menu";

export interface HeroProps {
  /** Hero headline */
  headline?: string;
  /** Short tagline below headline */
  tagline?: string;
  /** Hero subheadline */
  subheadline?: string;
  /** Primary CTA text */
  ctaText?: string;
  /** Primary CTA href */
  ctaHref?: string;
  /** Additional className */
  className?: string;
  /** Delivery fee in cents from business rules */
  deliveryFeeCents?: number;
  /** Free delivery threshold in cents from business rules */
  freeDeliveryThresholdCents?: number;
  /** @deprecated Use deliveryDays instead */
  cutoffDay?: number;
  /** @deprecated Use deliveryDays instead */
  cutoffHour?: number;
  /** Multi-day delivery configs from business rules */
  deliveryDays?: DeliveryDayConfig[];
  /** Aggregate delivered orders this month */
  deliveriesThisMonth?: number;
  /** Next upcoming delivery date display string */
  nextDeliveryDate?: string;
  /** Fee for addresses beyond long-distance threshold (cents) */
  longDistanceFeeCents?: number;
  /** Miles threshold for long-distance fee */
  longDistanceThresholdMiles?: number;
  /** Featured dishes (aggregated menu items) for the appetite carousel */
  featuredDishes?: MenuItem[];
}
