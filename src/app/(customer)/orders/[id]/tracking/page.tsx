/**
 * V2 Sprint 3: Customer Order Tracking Page
 *
 * Server component that fetches initial tracking data
 * and renders the client-side tracking experience.
 */

import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TrackingPageClient } from "@/components/tracking/TrackingPageClient";
import type { TrackingData } from "@/types/tracking";

// Type for fallback query result
interface FallbackOrderQueryResult {
  id: string;
  user_id: string;
  status: string;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  addresses: {
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    lat: number | null;
    lng: number | null;
  } | null;
  order_items: {
    id: string;
    name_snapshot: string;
    quantity: number;
    order_item_modifiers: {
      name_snapshot: string;
    }[];
  }[];
}

interface TrackingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TrackingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Track Order #${id.slice(0, 8)} | Mandalay Morning Star`,
    description: "Track your delivery in real-time",
  };
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { id: orderId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/orders/${orderId}/tracking`);
  }

  // Fetch tracking data from API
  // Note: We make an internal fetch to reuse the API logic
  // In production, this could be optimized with direct DB access
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Get session for auth header
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const response = await fetch(`${baseUrl}/api/tracking/${orderId}`, {
    headers: {
      Cookie: `sb-access-token=${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    if (response.status === 403) {
      redirect("/orders");
    }
    // For other errors, try to render with basic data
    console.error("Failed to fetch tracking data:", response.status);
  }

  const { data, error } = await response.json();

  if (error || !data) {
    // Fallback: fetch order directly
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        status,
        placed_at,
        confirmed_at,
        delivered_at,
        delivery_window_start,
        delivery_window_end,
        special_instructions,
        subtotal_cents,
        delivery_fee_cents,
        tax_cents,
        total_cents,
        addresses (
          line_1,
          line_2,
          city,
          state,
          postal_code,
          lat,
          lng
        ),
        order_items (
          id,
          name_snapshot,
          quantity,
          order_item_modifiers (
            name_snapshot
          )
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .returns<FallbackOrderQueryResult[]>()
      .single();

    if (orderError || !order) {
      notFound();
    }

    // Build minimal tracking data
    const fallbackData: TrackingData = {
      order: {
        id: order.id,
        status: order.status as TrackingData["order"]["status"],
        placedAt: order.placed_at,
        confirmedAt: order.confirmed_at,
        deliveredAt: order.delivered_at,
        deliveryWindowStart: order.delivery_window_start,
        deliveryWindowEnd: order.delivery_window_end,
        specialInstructions: order.special_instructions,
        address: order.addresses
          ? {
              line1: order.addresses.line_1,
              line2: order.addresses.line_2,
              city: order.addresses.city,
              state: order.addresses.state,
              postalCode: order.addresses.postal_code,
              lat: order.addresses.lat,
              lng: order.addresses.lng,
            }
          : {
              line1: "",
              line2: null,
              city: "",
              state: "",
              postalCode: "",
              lat: null,
              lng: null,
            },
        items: order.order_items.map((item) => ({
          id: item.id,
          name: item.name_snapshot,
          quantity: item.quantity,
          modifiers: item.order_item_modifiers.map((m) => m.name_snapshot),
        })),
        subtotalCents: order.subtotal_cents,
        deliveryFeeCents: order.delivery_fee_cents,
        taxCents: order.tax_cents,
        totalCents: order.total_cents,
      },
      routeStop: null,
      driver: null,
      driverLocation: null,
      eta: null,
    };

    return <TrackingPageClient orderId={orderId} initialData={fallbackData} />;
  }

  return <TrackingPageClient orderId={orderId} initialData={data} />;
}
