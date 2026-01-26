import { createClient } from "@/lib/supabase/server";
import { HeaderClient } from "./HeaderClient";
import type { UserRole } from "./NavLinks";
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

export async function HeaderServer(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = await getUserRole(user?.id);

  return <HeaderClient user={user} role={role} />;
}
