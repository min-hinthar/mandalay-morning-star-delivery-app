"use client";

import { useState, type ReactElement } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { updatePassword } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function SubmitButton(): ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-brand-red hover:bg-brand-red-dark"
      disabled={pending}
    >
      {pending ? "Updating password..." : "Update Password"}
    </Button>
  );
}

export function ResetPasswordForm(): ReactElement {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData): Promise<void> {
    setError(null);
    const result = await updatePassword(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              minLength={8}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <p className="text-sm text-center text-muted">
            Return to{" "}
            <Link href="/login" className="text-brand-red hover:underline">
              sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
