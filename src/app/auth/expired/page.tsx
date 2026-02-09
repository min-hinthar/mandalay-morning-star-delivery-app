"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/useToast";

function ExpiredContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const initialEmail = useMemo(
    () => searchParams.get("email") ?? "",
    [searchParams]
  );

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  const handleResend = () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setError(null);
    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("email", email);
        const result = await signInWithMagicLink(formData);

        if (result?.error) {
          setError(result.error);
          return;
        }

        toast({
          title: "Magic link sent",
          description: "Check your inbox for the new link.",
        });
        router.push("/login");
      })();
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full p-8 rounded-2xl bg-surface-primary shadow-lg text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-error-bg text-status-error">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-semibold text-text-primary">
            Link expired
          </h1>
          <p className="text-sm text-muted-foreground">
            This magic link has expired or has already been used.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error ?? undefined}
          />
          <Button
            type="button"
            className="w-full"
            onClick={handleResend}
            disabled={isPending}
          >
            Send a new link
          </Button>
        </div>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

export default function ExpiredLinkPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background" aria-hidden="true" />}
    >
      <ExpiredContent />
    </Suspense>
  );
}
