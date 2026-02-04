import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";

interface InviteWithProfile {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  invited_by: string;
  profiles: {
    full_name: string | null;
  } | null;
}

/**
 * GET /api/admin/drivers/invites
 * List all pending driver invites (not accepted, not revoked)
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    // Fetch pending invites with inviter profile
    const { data: invites, error: invitesError } = await supabase
      .from("driver_invites")
      .select(`
        id,
        email,
        created_at,
        expires_at,
        invited_by,
        profiles:invited_by (
          full_name
        )
      `)
      .is("revoked_at", null)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .returns<InviteWithProfile[]>();

    if (invitesError) {
      logger.exception(invitesError, { api: "admin/drivers/invites", flowId: "fetch" });
      return NextResponse.json(
        { error: "Failed to fetch invites" },
        { status: 500 }
      );
    }

    // Transform to API response format
    const now = new Date();
    const response = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      invitedBy: {
        id: invite.invited_by,
        name: invite.profiles?.full_name ?? "Admin",
      },
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
      isExpired: new Date(invite.expires_at) < now,
    }));

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/invites", flowId: "fetch" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
