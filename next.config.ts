import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
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
});
