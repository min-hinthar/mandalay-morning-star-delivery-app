import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /**
   * V7 Performance Optimizations
   *
   * Targets:
   * - FPS: 120fps (60fps minimum)
   * - FCP: < 1.5s
   * - LCP: < 2.5s
   * - CLS: < 0.1
   * - TBT: < 200ms
   */

  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Power efficient animations
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Optimize loading for V7 animations
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental optimizations
  experimental: {
    // Enable PPR for faster page loads
    // ppr: true,

    // Optimize package imports - V7 additions
    optimizePackageImports: [
      // Icons
      "lucide-react",
      // Animation
      "framer-motion",
      // Radix UI
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-tabs",
      "@radix-ui/react-accordion",
      "@radix-ui/react-select",
      "@radix-ui/react-popover",
      // Charts
      "recharts",
      // Date utilities
      "date-fns",
    ],

    // Turbo for faster builds
    // turbo: {},

    // Server Actions optimization
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Modular imports for better tree-shaking
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{ kebabCase member }}",
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // Headers for caching static assets
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

// Chain configs: bundleAnalyzer -> Sentry
export default withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    org: "mandalay-morning-star",
    project: "mandalay-morning-star-delivery-app",

    // Auth token for source maps upload
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Only print logs in CI
    silent: !process.env.CI,

    // Upload a larger set of source maps for prettier stack traces
    widenClientFileUpload: true,

    // Route Sentry requests through Next.js to bypass ad blockers
    tunnelRoute: "/monitoring",
  })
);
