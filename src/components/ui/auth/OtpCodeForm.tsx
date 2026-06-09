"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

import { verifyEmailOtp } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// Supabase's email OTP length is a project setting (commonly 6, sometimes 8),
// so the entry is length-agnostic: accept the digits, let verifyOtp judge.
const MIN_LEN = 4;
const MAX_LEN = 10;

interface OtpCodeFormProps {
  email: string;
  /** Where to go after a successful verification. */
  redirectTo?: string;
}

/**
 * One-time-code entry. Finishing here keeps the customer on the same tab/origin
 * (no email-link click → no browser switch → cart preserved). A single field
 * adapts to whatever length the email code is and supports paste + Enter.
 */
export function OtpCodeForm({ email, redirectTo }: OtpCodeFormProps) {
  const router = useRouter();
  const { shouldAnimate } = useAnimationPreference();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerShake = () => {
    if (!shouldAnimate) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const submit = (value: string) => {
    if (value.length < MIN_LEN || isPending || isSuccess) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        const fd = new FormData();
        fd.set("email", email);
        fd.set("code", value);
        if (redirectTo) fd.set("redirectTo", redirectTo);

        const result = await verifyEmailOtp(fd);

        if (result?.error) {
          setError(result.error);
          setCode("");
          triggerShake();
          return;
        }

        setIsSuccess(true);
        router.push(result.redirectPath ?? "/menu");
        router.refresh();
      })();
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(code);
  };

  const buttonLabel = isSuccess ? "Signing you in…" : isPending ? "Verifying…" : "Verify & sign in";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <m.div
        animate={isShaking ? { x: [0, -8, 8, -4, 4, 0] } : undefined}
        transition={{ duration: 0.4 }}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          disabled={isPending || isSuccess}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, MAX_LEN))}
          aria-label="Sign-in code from your email"
          aria-invalid={Boolean(error)}
          className={cn(
            "h-14 w-full rounded-2xl border text-center text-2xl font-semibold tabular-nums",
            "bg-hero-card text-hero-ink tracking-[0.5em] indent-[0.5em]",
            "transition-all duration-200",
            "focus:border-hero-clay focus-visible:ring-2 focus-visible:ring-hero-clay/30 focus:outline-none",
            error ? "border-status-error" : "border-hero-line",
            isSuccess && "border-green bg-green/5"
          )}
        />
      </m.div>

      {error && (
        <p className="text-status-error text-center text-sm" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={code.length < MIN_LEN || isPending || isSuccess}
        className="h-11 w-full rounded-2xl font-semibold"
      >
        {(isPending || isSuccess) &&
          (isSuccess ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ))}
        {buttonLabel}
      </Button>
    </form>
  );
}

export default OtpCodeForm;
