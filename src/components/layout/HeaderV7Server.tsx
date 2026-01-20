import { createClient } from "@/lib/supabase/server";
import { HeaderV7Client } from "./HeaderV7Client";
import type { UserRole } from "./nav-links";
import type { ReactElement } from "react";

async function getUserRole(userId: string | undefined): Promise<UserRole> {
  if (!userId) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile?.role) return "customer";
  return profile.role as UserRole;
}

export async function HeaderV7Server(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = await getUserRole(user?.id);

  return <HeaderV7Client user={user} role={role} />;
}
