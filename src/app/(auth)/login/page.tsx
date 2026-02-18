import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { LoginPageClient } from "./LoginPageClient";

export default async function LoginPage(): Promise<ReactElement> {
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

  return <LoginPageClient />;
}
