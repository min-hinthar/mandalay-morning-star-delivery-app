"use client";

import { useRef, useState, useTransition, type ClipboardEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

import { verifyEmailOtp } from "@/lib/supabase/actions";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const CODE_LENGTH = 6;

interface OtpCodeFormProps {
  email: string;
  /** Where to go after a successful verification. */
  redirectTo?: string;
}

/**
 * Six-box one-time-code entry. Lets the customer finish signing in on the same
 * tab (no email-link click → no browser switch → cart preserved). Supports
 * auto-advance, backspace, paste, and auto-submit on the sixth digit.
 */
export function OtpCodeForm({ email, redirectTo }: OtpCodeFormProps) {
  const router = useRouter();
  const { shouldAnimate } = useAnimationPreference();
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const focusInput = (index: number) => inputsRef.current[index]?.focus();

  const triggerShake = () => {
    if (!shouldAnimate) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const submit = (code: string) => {
    if (code.length !== CODE_LENGTH || isPending || isSuccess) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        const fd = new FormData();
        fd.set("email", email);
        fd.set("code", code);
        if (redirectTo) fd.set("redirectTo", redirectTo);

        const result = await verifyEmailOtp(fd);

        if (result?.error) {
          setError(result.error);
          setDigits(Array(CODE_LENGTH).fill(""));
          triggerShake();
          focusInput(0);
          return;
        }

        setIsSuccess(true);
        router.push(result.redirectPath ?? "/menu");
        router.refresh();
      })();
    });
  };

  const writeDigits = (next: string[]) => {
    setDigits(next);
    return next;
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      writeDigits(next);
      return;
    }
    // Keep the most recently typed digit (handles overtype).
    const digit = cleaned[cleaned.length - 1];
    const next = [...digits];
    next[index] = digit;
    writeDigits(next);

    if (index < CODE_LENGTH - 1) focusInput(index + 1);

    const joined = next.join("");
    if (joined.length === CODE_LENGTH && !joined.includes("")) submit(joined);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      writeDigits(next);
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? "");
    writeDigits(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
    if (pasted.length === CODE_LENGTH) submit(pasted);
  };

  return (
    <div className="space-y-3">
      <m.div
        animate={isShaking ? { x: [0, -8, 8, -4, 4, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="flex justify-center gap-2"
        role="group"
        aria-label="6-digit sign-in code"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={isPending || isSuccess}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              "h-12 w-10 rounded-xl border text-center text-lg font-semibold tabular-nums",
              "bg-surface-secondary/50 text-text-primary",
              "transition-all duration-200",
              "focus:border-primary focus:bg-surface-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus:outline-none",
              error ? "border-status-error" : "border-border",
              isSuccess && "border-green bg-green/5"
            )}
          />
        ))}
      </m.div>

      {error && (
        <p className="text-status-error text-sm text-center" role="alert">
          {error}
        </p>
      )}

      {(isPending || isSuccess) && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-green" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isSuccess ? "Signing you in…" : "Verifying…"}
        </p>
      )}
    </div>
  );
}

export default OtpCodeForm;
