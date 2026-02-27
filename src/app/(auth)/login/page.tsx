import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { Suspense } from "react";
import { LoginPageClient } from "./LoginPageClient";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<ReactElement> {
  // Gracefully handle missing Supabase env vars (e.g., CI/LHCI)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Role-based redirect for already-authenticated users
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role as string | undefined;

      if (role === "admin") redirect("/admin");

      if (role === "driver") {
        const { data: driver } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (driver) redirect("/driver");
      }

      redirect("/");
    }
  } catch {
    // Supabase unavailable — show login form without auth check
  }

  return (
    <Suspense>
      <LoginPageClient />
    </Suspense>
  );
}
