import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const reorderSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/sections/reorder" });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Update sort_order for each section
    const updates = parsed.data.sectionIds.map((sectionId, index) =>
      auth.supabase
        .from("featured_sections")
        .update({
          sort_order: index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectionId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/reorder", flowId: "reorder" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
