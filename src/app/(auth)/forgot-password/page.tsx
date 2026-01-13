import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import type { ReactElement } from "react";

export default async function ForgotPasswordPage(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-brand-red">
            Reset Password
          </h1>
          <p className="mt-2 text-muted">
            Enter your email to receive reset instructions
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
