import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface AdminProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: ProfileRole;
  created_at: string;
}

const updateAdminProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
    .nullable()
    .optional(),
});

function transformAdminProfile(
  row: AdminProfileRow,
  authProvider: string,
  memberSince: string
) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    authProvider,
    memberSince,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/admin/profile
 * Returns admin profile with role, auth provider, and member-since date
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json(
        { error: { code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: auth.error } },
        { status: auth.status }
      );
    }
    const { supabase, userId } = auth;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, role, created_at")
      .eq("id", userId)
      .returns<AdminProfileRow[]>()
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    // Get auth user for identities and created_at
    const { data: { user } } = await supabase.auth.getUser();

    const authProvider =
      user?.identities?.[0]?.provider ?? "email";
    const memberSince = user?.created_at ?? profile.created_at;

    return NextResponse.json({
      data: transformAdminProfile(profile, authProvider, memberSince),
    });
  } catch (error) {
    logger.exception(error, { api: "admin/profile" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/profile
 * Update admin name and phone (role is read-only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json(
        { error: { code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: auth.error } },
        { status: auth.status }
      );
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const result = updateAdminProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    const { fullName, phone } = result.data;

    // Build update — role changes are NOT allowed
    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("id, email, full_name, phone, role, created_at")
      .returns<AdminProfileRow[]>()
      .single();

    if (updateError) throw updateError;

    // Get auth user for identities and created_at
    const { data: { user } } = await supabase.auth.getUser();

    const authProvider =
      user?.identities?.[0]?.provider ?? "email";
    const memberSince = user?.created_at ?? profile.created_at;

    return NextResponse.json({
      data: transformAdminProfile(profile, authProvider, memberSince),
    });
  } catch (error) {
    logger.exception(error, { api: "admin/profile" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    );
  }
}
