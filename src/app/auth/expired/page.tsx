"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/useToast";
import { AuthBackground } from "@/components/ui/auth";

function ExpiredContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

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
    <AuthBackground>
      <div className="w-full sm:max-w-md bg-surface-primary sm:bg-surface-primary/70 sm:backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl ring-1 ring-white/30 dark:ring-white/10">
        <div className="h-1.5 bg-gradient-to-r from-status-error via-primary to-status-error rounded-t-3xl" />
        <div className="p-7 sm:p-9 text-center space-y-6">
          {/* Error icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-status-error/10 to-status-error/5 border border-status-error/15 text-status-error">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold text-text-primary">Link expired</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This magic link has expired or has already been used.
              <br />
              No worries — we&apos;ll send you a fresh one.
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
              className="rounded-2xl h-12"
            />
            <Button
              type="button"
              className="w-full h-12 rounded-2xl font-semibold"
              onClick={handleResend}
              disabled={isPending}
            >
              {isPending ? "Sending\u2026" : "Send a new link"}
            </Button>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthBackground>
  );
}

export default function ExpiredLinkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" aria-hidden="true" />}>
      <ExpiredContent />
    </Suspense>
  );
}
