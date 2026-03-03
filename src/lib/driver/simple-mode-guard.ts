import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface DriverSimpleModeResult {
  id: string;
  simple_mode: boolean;
}

/**
 * Guard for simple-mode-hidden driver pages.
 * Redirects to /driver if simple mode is active or driver not found.
 * Returns driver id if allowed through.
 */
export async function checkSimpleMode(): Promise<{ id: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver");
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, simple_mode")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverSimpleModeResult[]>()
    .single();

  if (!driver) {
    redirect("/driver");
  }

  if ((driver as unknown as Record<string, unknown>).simple_mode === true) {
    redirect("/driver");
  }

  return { id: driver.id };
}
