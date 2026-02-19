import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/account";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

function transformProfile(row: ProfileRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

// GET /api/account/profile - Get current user's profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "account/profile",
    });
    if (rl.limited) return rl.response;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at")
      .eq("id", user.id)
      .returns<ProfileRow>()
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: transformProfile(profile) });
  } catch (error) {
    logger.exception(error, { api: "account/profile" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" } },
      { status: 500 }
    );
  }
}

// PATCH /api/account/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rlPatch = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "account/profile",
    });
    if (rlPatch.limited) return rlPatch.response;

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    const { fullName, phone } = result.data;

    // Build update object
    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, full_name, phone, created_at")
      .returns<ProfileRow>()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: transformProfile(profile) });
  } catch (error) {
    logger.exception(error, { api: "account/profile" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    );
  }
}
