import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { CustomerShell } from "./CustomerShell";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  return <CustomerShell>{children}</CustomerShell>;
}
