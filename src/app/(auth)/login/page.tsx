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
    redirect("/");
  }

  return <LoginPageClient />;
}
