/**
 * V2 Sprint 3: Customer Order Tracking Page
 *
 * Server component that fetches tracking data via direct DB queries
 * and renders the client-side tracking experience.
 */

import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TrackingPageClient } from "@/components/ui/orders/tracking/TrackingPageClient";
import { fetchTrackingData } from "./fetchTrackingData";

interface TrackingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TrackingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Track Order #${id.slice(0, 8)} | Mandalay Morning Star`,
    description: "Track your delivery in real-time",
  };
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { id: orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/orders/${orderId}/tracking`);
  }

  const trackingData = await fetchTrackingData(supabase, orderId, user.id);

  if (!trackingData) {
    notFound();
  }

  return <TrackingPageClient orderId={orderId} initialData={trackingData} />;
}
