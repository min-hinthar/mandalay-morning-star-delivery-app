/**
 * Image Optimization Utilities
 *
 * Helpers for Next.js Image component to improve Core Web Vitals:
 * - LCP: Priority loading for above-the-fold images
 * - CLS: Explicit dimensions to prevent layout shifts
 */

import type { ImageProps } from "next/image";

/**
 * Standard image sizes for responsive images
 * Maps to common breakpoints and aspect ratios
 */
export const IMAGE_SIZES = {
  // Menu item cards (16:9)
  menuCard: {
    sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
    width: 400,
    height: 225,
  },
  // Featured/hero images
  hero: {
    sizes: "100vw",
    width: 1920,
    height: 1080,
  },
  // Thumbnails
  thumbnail: {
    sizes: "(max-width: 640px) 25vw, 10vw",
    width: 96,
    height: 96,
  },
  // Cart item images
  cartItem: {
    sizes: "80px",
    width: 80,
    height: 80,
  },
  // Avatar images
  avatar: {
    sizes: "40px",
    width: 40,
    height: 40,
  },
} as const;

type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Get optimized image props for a given size preset
 */
export function getImageProps(
  size: ImageSize,
  options?: {
    priority?: boolean;
    quality?: number;
  }
): Partial<ImageProps> {
  const preset = IMAGE_SIZES[size];

  return {
    sizes: preset.sizes,
    width: preset.width,
    height: preset.height,
    priority: options?.priority ?? false,
    quality: options?.quality ?? 85,
    loading: options?.priority ? "eager" : "lazy",
  };
}

/**
 * Placeholder blur data URL generator
 * Creates a tiny blurred placeholder for smoother image loading
 */
export function getPlaceholderBlur(
  color: string = "#f5f5f0"
): `data:image/${string}` {
  // Tiny 1x1 SVG with the dominant color
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="${color}" width="1" height="1"/></svg>`;
  const base64 = typeof window === "undefined"
    ? Buffer.from(svg).toString("base64")
    : btoa(svg);

  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Calculate aspect ratio padding for CLS prevention
 * Use as paddingBottom in a container div
 */
export function getAspectRatioPadding(width: number, height: number): string {
  return `${(height / width) * 100}%`;
}

/**
 * Common aspect ratios as CSS values
 */
export const ASPECT_RATIOS = {
  "16:9": "56.25%",
  "4:3": "75%",
  "1:1": "100%",
  "3:4": "133.33%",
  "9:16": "177.78%",
} as const;

/**
 * Check if image should be priority loaded based on position
 */
export function shouldPriorityLoad(index: number, viewportItems: number = 4): boolean {
  return index < viewportItems;
}

/**
 * Generate srcSet for responsive images (when not using next/image)
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map((w) => {
      // Assuming Supabase storage with transform support
      if (baseSrc.includes("supabase")) {
        return `${baseSrc}?width=${w} ${w}w`;
      }
      return `${baseSrc} ${w}w`;
    })
    .join(", ");
}
