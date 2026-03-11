import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface AdminRecipient {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * Queries `profiles` table for all admin users.
 * Returns array of { id, email, full_name } for sending admin emails.
 */
export async function getAdminEmails(): Promise<AdminRecipient[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "admin");

  if (error) {
    logger.error("Failed to query admin profiles", {
      flowId: "admin-email",
      error: error.message,
    });
    return [];
  }

  // Filter out admins without email
  return (data ?? []).filter((p): p is AdminRecipient => p.email !== null && p.email !== "");
}
