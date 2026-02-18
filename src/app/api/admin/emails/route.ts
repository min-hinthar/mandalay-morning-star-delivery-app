import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const VALID_SORT_COLUMNS = [
  "created_at",
  "sent_at",
  "notification_type",
  "status",
  "recipient",
] as const;

const VALID_STATUSES = [
  "sent",
  "failed",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
] as const;

const VALID_TYPES = [
  "order_confirmation",
  "cancellation",
  "refund",
  "delivery_reminder",
  "out_for_delivery",
  "arriving_soon",
  "delivered",
] as const;

interface NotificationLogRow {
  id: string;
  order_id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  resend_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

/**
 * GET /api/admin/emails
 *
 * Paginated email log list with filtering by order ID, type, status, and date range.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/emails" });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);

    // Parse query params
    const orderId = searchParams.get("orderId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";

    // Validate sort column
    if (!VALID_SORT_COLUMNS.includes(sort as (typeof VALID_SORT_COLUMNS)[number])) {
      return NextResponse.json(
        { error: `Invalid sort column. Valid: ${VALID_SORT_COLUMNS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate sort direction
    if (order !== "asc" && order !== "desc") {
      return NextResponse.json(
        { error: 'Invalid order direction. Valid: "asc", "desc"' },
        { status: 400 }
      );
    }

    // Validate type filter
    if (type && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid type filter. Valid: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate status filter
    if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Invalid status filter. Valid: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Build query — notification_logs not in Database type, cast final result
    let query = supabase
      .from("notification_logs")
      .select(
        "id, order_id, user_id, notification_type, channel, recipient, subject, resend_id, status, error_message, sent_at, created_at",
        { count: "exact" }
      );

    // Apply filters
    if (orderId) {
      query = query.eq("order_id", orderId);
    }
    if (type) {
      query = query.eq("notification_type", type);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    // Apply sorting and pagination
    const ascending = order === "asc";
    query = query.order(sort, { ascending });

    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;
    query = query.range(rangeStart, rangeEnd);

    const { data, error, count } = (await query) as {
      data: NotificationLogRow[] | null;
      error: { message: string } | null;
      count: number | null;
    };

    if (error) {
      logger.exception(error, { api: "admin/emails" });
      return NextResponse.json({ error: "Failed to fetch email logs" }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/emails" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
