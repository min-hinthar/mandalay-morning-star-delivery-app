import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /**
   * Performance Optimizations
   */
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Experimental optimizations
  experimental: {
    // Enable PPR for faster page loads
    // ppr: true,
    // Optimize package imports
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-tabs",
    ],
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
