import { notFound } from "next/navigation";
import { CheckoutPreviewClient } from "./CheckoutPreviewClient";

/**
 * Non-production checkout design preview.
 *
 * The whole (customer) route group is auth-gated at the layout level
 * (server-side getUser → redirect to /login), and /login can't init without
 * Supabase env on a Preview deployment — so checkout is unreachable on the
 * Vercel preview without a real session. This route lives OUTSIDE that gate
 * and seeds a mock cart, so the "After Dark" checkout UI can be reviewed on
 * the clickable preview link with zero login.
 *
 * Gated out of production (VERCEL_ENV === "production" → 404). Available on
 * preview deployments and local dev only. No real auth / cart / payment.
 */
export const metadata = {
  title: "Checkout Preview (non-prod)",
  robots: { index: false, follow: false },
};

export default function CheckoutPreviewPage() {
  // Fail closed: VERCEL_ENV is undefined on non-Vercel/self-hosted prod builds,
  // so also block on NODE_ENV. Available on Vercel preview + local dev only.
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    notFound();
  }
  return <CheckoutPreviewClient />;
}
