import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, apiWriteLimiter, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { AdminFeedbackAlert } from "@/emails/AdminFeedbackAlert";
import { FeedbackConfirmation } from "@/emails/FeedbackConfirmation";
import { logger } from "@/lib/utils/logger";
import { createFeedbackSchema } from "./schemas";

// ============================================
// POST — Create feedback
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Optional auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rate limit by user_id or IP
    const identifier = user?.id ?? getClientIp(request);
    const rl = await checkRateLimit({
      limiter: apiWriteLimiter,
      identifier,
      role: user ? "customer" : "anon",
      route: "/api/feedback",
    });
    if (rl.limited) return rl.response;

    // Parse body — supports JSON or multipart/form-data (with screenshot)
    const contentType = request.headers.get("content-type") ?? "";
    let body: unknown;
    let screenshotFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const dataField = formData.get("data");
      if (typeof dataField !== "string") {
        return NextResponse.json({ error: "Missing data field" }, { status: 400 });
      }
      body = JSON.parse(dataField);
      const file = formData.get("screenshot");
      if (file instanceof File) {
        screenshotFile = file;
      }
    } else {
      body = await request.json();
    }

    const parsed = createFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Validate screenshot file if provided
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (screenshotFile) {
      if (!ALLOWED_MIME_TYPES.includes(screenshotFile.type)) {
        return NextResponse.json(
          { error: "Screenshot must be JPEG, PNG, or WebP" },
          { status: 400 }
        );
      }
      if (screenshotFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Screenshot must be under 5MB" }, { status: 400 });
      }
    }

    const { category, subject, message, orderId, pageUrl, userAgent, sentryEventId, contactEmail } =
      parsed.data;

    // Require email for unauthenticated users
    if (!user && !contactEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // If orderId provided, verify ownership (auth required)
    if (orderId) {
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required for order-related feedback" },
          { status: 401 }
        );
      }
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    // Insert feedback (screenshot uploaded after to get feedbackId for path)
    const service = createServiceClient();
    const resolvedEmail = user?.email ?? contactEmail ?? null;

    const { data: feedback, error: insertError } = await service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("customer_feedback" as any)
      .insert({
        user_id: user?.id ?? null,
        contact_email: resolvedEmail,
        category,
        subject,
        message,
        order_id: orderId ?? null,
        page_url: pageUrl ?? null,
        user_agent: userAgent ?? null,
        sentry_event_id: sentryEventId ?? null,
        screenshot_url: null,
        screenshot_path: null,
        status: "new",
      } as Record<string, unknown>)
      .select("id")
      .single();

    if (insertError || !feedback) {
      logger.error("Failed to insert feedback", { error: insertError?.message });
      return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }

    const feedbackId = (feedback as unknown as Record<string, unknown>).id as string;

    // Upload screenshot to storage if provided
    let screenshotUrl: string | null = null;
    if (screenshotFile) {
      const buffer = Buffer.from(await screenshotFile.arrayBuffer());
      const storagePath = `${feedbackId}/${screenshotFile.name}`;

      const { error: uploadError } = await service.storage
        .from("feedback-attachments")
        .upload(storagePath, buffer, { contentType: screenshotFile.type });

      if (uploadError) {
        logger.error("Failed to upload screenshot", { error: uploadError.message, feedbackId });
      } else {
        const {
          data: { publicUrl },
        } = service.storage.from("feedback-attachments").getPublicUrl(storagePath);

        screenshotUrl = publicUrl;

        // Update feedback row with screenshot URL + path
        await service
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("customer_feedback" as any)
          .update({
            screenshot_url: publicUrl,
            screenshot_path: storagePath,
          } as Record<string, unknown>)
          .eq("id", feedbackId);
      }
    }

    // Send emails asynchronously
    after(async () => {
      try {
        // Notify admins
        const { data: admins } = await service.from("profiles").select("email").eq("role", "admin");

        const adminEmails = (admins ?? [])
          .map((a: Record<string, unknown>) => a.email as string)
          .filter(Boolean);

        for (const adminEmail of adminEmails) {
          await sendEmail({
            to: adminEmail,
            subject: `[Feedback] ${category}: ${subject}`,
            react: AdminFeedbackAlert({
              feedbackId,
              category,
              subject,
              message: message.slice(0, 200),
              customerEmail: resolvedEmail ?? "Unknown",
              hasScreenshot: !!screenshotUrl,
            }),
            type: "admin_feedback_alert" as never,
            orderId: orderId ?? feedbackId,
            userId: user?.id ?? "anonymous",
            mandatory: true,
          });
        }

        // Customer confirmation
        if (resolvedEmail) {
          await sendEmail({
            to: resolvedEmail,
            subject: `We received your feedback — #${feedbackId.slice(0, 8).toUpperCase()}`,
            react: FeedbackConfirmation({
              feedbackId,
              category,
              subject,
              isAuthenticated: !!user,
            }),
            type: "feedback_confirmation" as never,
            orderId: orderId ?? feedbackId,
            userId: user?.id ?? "anonymous",
            idempotencyKey: `feedback-confirm-${feedbackId}`,
          });
        }
      } catch (emailErr) {
        logger.error("Failed to send feedback emails", { feedbackId });
        logger.exception(emailErr, { flowId: "feedback-email" });
      }
    });

    return NextResponse.json(
      { id: feedbackId, message: "Feedback submitted successfully" },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Feedback POST error");
    logger.exception(err, { flowId: "feedback" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// GET — List own feedback (authenticated)
// ============================================

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: feedback, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("customer_feedback" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch feedback", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    return NextResponse.json({ feedback: feedback ?? [] });
  } catch (err) {
    logger.error("Feedback GET error");
    logger.exception(err, { flowId: "feedback" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
