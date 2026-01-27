import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/ui/auth/SignupForm";
import type { ReactElement } from "react";

export default async function SignupPage(): Promise<ReactElement> {
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
            Create Account
          </h1>
          <p className="mt-2 text-muted">Join Mandalay Morning Star</p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
