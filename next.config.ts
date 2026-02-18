import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";
import { readFileSync } from "fs";

const { version: appVersion } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Note: Service worker is built separately via scripts/build-sw.mjs
// This avoids Serwist/Turbopack compatibility issues in Next.js 16
// SW registration happens via src/lib/hooks/useServiceWorker.ts

// ---------------------------------------------------------------------------
// CSP & Security Headers
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === "development";

// Parse Sentry DSN to build CSP reporting endpoint
// DSN format: https://<PUBLIC_KEY>@<ORG_SLUG>.ingest.us.sentry.io/<PROJECT_ID>
function parseSentryDsn(dsn: string | undefined) {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace("/", "");
    const ingestDomain = url.hostname; // e.g. o1234.ingest.us.sentry.io
    return {
      endpoint: `https://${ingestDomain}/api/${projectId}/security/?sentry_key=${publicKey}`,
    };
  } catch {
    return null;
  }
}

const sentryDsn = parseSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);

const cspDirectives = [
  "default-src 'self'",
  // Google Maps requires *.googleapis.com, *.gstatic.com, *.google.com, blob:
  // See: https://developers.google.com/maps/documentation/javascript/content-security-policy
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.googleapis.com https://*.gstatic.com https://*.google.com blob:`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://*.supabase.co https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Google Maps: *.googleapis.com, *.google.com, *.gstatic.com, data:, blob:
  // Vercel Speed Insights: vitals.vercel-insights.com (fallback when not proxied)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io https://*.googleapis.com https://*.google.com https://*.gstatic.com https://vitals.vercel-insights.com data: blob:",
  "worker-src 'self' blob:",
  "frame-src https://*.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  !isDev ? "upgrade-insecure-requests" : "",
  sentryDsn ? `report-uri ${sentryDsn.endpoint}` : "",
  sentryDsn ? "report-to csp-endpoint" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  ...(sentryDsn
    ? [
        {
          key: "Report-To",
          value: JSON.stringify({
            group: "csp-endpoint",
            max_age: 10886400,
            endpoints: [{ url: sentryDsn.endpoint }],
            include_subdomains: true,
          }),
        },
        {
          key: "Reporting-Endpoints",
          value: `csp-endpoint="${sentryDsn.endpoint}"`,
        },
      ]
    : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

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

  // Expose app version for service worker update banner
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },

  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // React Compiler auto-memoizes all client components
  // Eliminates unnecessary re-renders without manual useMemo/useCallback
  reactCompiler: true,

  // Compress responses
  compress: true,

  // Power efficient animations
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 85], // Required for Next.js 16 - 70 for menu, 85 for hero
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Optimize loading for V7 animations
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allow Supabase Storage and Google Drive images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ukuzkhuppqwtrdkjqrkv.supabase.co",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Prevent Turbopack bundling issues with @react-email/render (prettier dep)
  serverExternalPackages: ["@react-email/render"],

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
      // Maps - optimize tree-shaking
      "@react-google-maps/api",
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
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Headers for CSP, security, caching, and CORS
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/health",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
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
