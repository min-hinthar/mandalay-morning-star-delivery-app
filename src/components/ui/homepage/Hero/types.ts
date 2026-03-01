/**
 * Hero Types
 */

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
  /** Cutoff day (0=Sun..6=Sat) from business rules */
  cutoffDay?: number;
  /** Cutoff hour (0-23) from business rules */
  cutoffHour?: number;
}
