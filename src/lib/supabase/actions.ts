"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export interface ActionResult {
  error?: string;
  success?: string;
}

async function getAppUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function signInWithMagicLink(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/login";

  if (!email) {
    return { error: "Email is required" };
  }

  const rateCheck = checkRateLimit(email, "signIn");
  if (!rateCheck.allowed) {
    return {
      error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const appUrl = await getAppUrl();
  const callbackNext = encodeURIComponent(redirectTo);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${callbackNext}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a magic link to sign in" };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
