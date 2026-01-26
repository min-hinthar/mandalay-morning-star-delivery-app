import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import type { ReactElement } from "react";

export default function ResetPasswordPage(): ReactElement {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-brand-red">
            Choose a New Password
          </h1>
          <p className="mt-2 text-muted">
            Set a new password to finish resetting your account
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
