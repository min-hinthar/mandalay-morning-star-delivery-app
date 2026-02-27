"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { signInWithMagicLink, resendDriverInvite } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/hooks/useToastV8";
import { AuthBackground } from "@/components/ui/auth";

function ExpiredContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const inviteId = useMemo(() => searchParams.get("invite_id"), [searchParams]);
  const isDriverInvite = Boolean(inviteId);

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  const handleResend = () => {
    setError(null);

    // Driver invite resend — uses invite_id, no email input needed
    if (isDriverInvite) {
      startTransition(() => {
        void (async () => {
          const result = await resendDriverInvite(inviteId!);

          if (result?.error) {
            setError(result.error);
            return;
          }

          toast({
            message: "Check your inbox for the new driver invite link.",
            type: "success",
          });
          router.push("/login");
        })();
      });
      return;
    }

    // Generic magic link resend
    if (!email) {
      setError("Please enter your email.");
      return;
    }

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
          message: "Check your inbox for the new link.",
          type: "success",
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
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {isDriverInvite ? "Driver invite link expired" : "Link expired"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isDriverInvite ? (
                "Your driver invite link has expired. Tap below to receive a new one."
              ) : (
                <>
                  This magic link has expired or has already been used.
                  <br />
                  No worries — we&apos;ll send you a fresh one.
                </>
              )}
            </p>
          </div>

          <div className="space-y-3">
            {!isDriverInvite && (
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={error ?? undefined}
                className="rounded-2xl h-12"
              />
            )}
            {error && isDriverInvite && <p className="text-sm text-status-error">{error}</p>}
            <Button
              type="button"
              className="w-full h-12 rounded-2xl font-semibold"
              onClick={handleResend}
              disabled={isPending}
            >
              {isPending
                ? "Sending\u2026"
                : isDriverInvite
                  ? "Resend invite link"
                  : "Send a new link"}
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
