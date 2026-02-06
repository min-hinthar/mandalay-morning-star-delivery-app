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
}
