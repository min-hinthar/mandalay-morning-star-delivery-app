/**
 * V2 Sprint 4: Customer Feedback Page
 *
 * Allows customers to rate their delivery experience after
 * an order has been delivered.
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeliveryFeedbackForm } from "./DeliveryFeedbackForm";
import type { OrderStatus } from "@/types/database";

interface OrderCheck {
  id: string;
  user_id: string;
  status: OrderStatus;
  delivered_at: string | null;
}

interface ExistingRating {
  id: string;
  rating: number;
  feedback_text: string | null;
  submitted_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Rate Your Delivery | Mandalay Morning Star",
  description: "Share your feedback about your delivery experience",
};

export default async function FeedbackPage({ params }: PageProps) {
  const { id: orderId } = await params;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/orders/${orderId}/feedback`);
  }

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status, delivered_at")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .returns<OrderCheck[]>()
    .single();

  if (orderError || !order) {
    notFound();
  }

  // Check if order is delivered
  if (order.status !== "delivered") {
    redirect(`/orders/${orderId}`);
  }

  // Check if rating already exists
  const { data: existingRating } = await supabase
    .from("driver_ratings")
    .select("id, rating, feedback_text, submitted_at")
    .eq("order_id", orderId)
    .returns<ExistingRating[]>()
    .single();

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-lotus/30 py-8 px-4">
      <div className="mx-auto max-w-md">
        <DeliveryFeedbackForm
          orderId={orderId}
          existingRating={
            existingRating
              ? {
                  id: existingRating.id,
                  rating: existingRating.rating,
                  feedbackText: existingRating.feedback_text,
                  submittedAt: existingRating.submitted_at,
                }
              : null
          }
        />
      </div>
    </main>
  );
}
