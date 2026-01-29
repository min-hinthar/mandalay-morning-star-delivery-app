"use client";

import { useState, type ReactElement } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signIn } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function SubmitButton(): ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-brand-red-dark"
      disabled={pending}
    >
      {pending ? "Sending magic link..." : "Send magic link"}
    </Button>
  );
}

export function LoginForm(): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData): Promise<void> {
    setError(null);
    setSuccess(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
    }
    if (result?.success) {
      setSuccess(result.success);
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
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              {success}
            </div>
          )}
          <p className="text-sm text-text-secondary">
            We&apos;ll email you a magic link to sign in.
          </p>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <p className="text-sm text-center text-text-primary">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-red hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
