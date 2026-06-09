"use client";

import { useEffect, useState, useTransition } from "react";
import { useAnimate, m } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { OtpCodeForm } from "./OtpCodeForm";

interface MagicLinkConfirmationProps {
  email: string;
  onBack: () => void;
  /** Where to redirect after login (forwarded through auth callback) */
  redirectTo?: string;
}

/* Sparkle positions around the envelope — placed by hand for organic feel */
interface SparklePos {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay: number;
}

const SPARKLE_POSITIONS: SparklePos[] = [
  { top: "-6px", right: "-10px", delay: 0 },
  { top: "8px", left: "-14px", delay: 0.3 },
  { bottom: "4px", right: "-8px", delay: 0.6 },
  { top: "-2px", left: "50%", delay: 0.15 },
];

export function MagicLinkConfirmation({ email, onBack, redirectTo }: MagicLinkConfirmationProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [scope, animate] = useAnimate();
  const [countdown, setCountdown] = useState(0);
  const [showSpamHint, setShowSpamHint] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!shouldAnimate) return;
    let isActive = true;

    const runAnimation = async () => {
      /* Envelope floats up from below */
      await animate(
        "#envelope-container",
        { y: [40, 0], opacity: [0, 1], scale: [0.8, 1] },
        { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
      );

      if (!isActive) return;

      /* Gentle breathing pulse */
      animate(
        "#envelope-icon",
        { scale: [1, 1.06, 1], rotate: [0, 2, 0, -2, 0] },
        { duration: 3, repeat: Infinity, ease: "easeInOut" }
      );

      /* Glow pulses */
      animate(
        "#envelope-glow",
        { opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] },
        { duration: 3, repeat: Infinity, ease: "easeInOut" }
      );
    };

    void runAnimation();

    return () => {
      isActive = false;
    };
  }, [animate, shouldAnimate]);

  /* Show spam hint after 18s of waiting */
  useEffect(() => {
    const timeout = setTimeout(() => setShowSpamHint(true), 18000);
    return () => clearTimeout(timeout);
  }, []);

  /* Countdown timer for resend throttle */
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleResend = () => {
    if (countdown > 0) return;

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("email", email);
        if (redirectTo) formData.set("redirectTo", redirectTo);
        const result = await signInWithMagicLink(formData);

        if (result?.error) {
          toast({
            message: result.error,
            type: "error",
          });
          return;
        }

        toast({
          message: "Check your inbox for the new link.",
          type: "success",
        });
        setCountdown(60);
      })();
    });
  };

  const resendLabel = countdown > 0 ? `Resend in ${countdown}s` : "Resend magic link";

  return (
    <div className="space-y-6" ref={scope}>
      {/* Envelope with sparkles and glow */}
      <div className="flex justify-center">
        <div id="envelope-container" className="relative">
          {/* Golden glow behind — radial-gradient falloff (no blur, iOS-safe) */}
          <div
            id="envelope-glow"
            className="absolute -inset-6 rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, var(--hero-gold), transparent 68%)",
            }}
            aria-hidden="true"
          />

          {/* Sparkle accents */}
          {shouldAnimate &&
            SPARKLE_POSITIONS.map((pos, i) => (
              <m.div
                key={i}
                className="absolute z-10 text-amber-400"
                style={{ top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: pos.delay, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </m.div>
            ))}

          {/* Envelope circle */}
          <div
            id="envelope-icon"
            className="relative flex h-22 w-22 items-center justify-center rounded-full border border-hero-clay/20 bg-hero-clay/10 text-hero-clay"
          >
            <Mail className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="font-display text-xl font-bold text-hero-ink">Check your email</h2>
        <p className="text-sm leading-relaxed text-hero-ink-muted">
          We sent a sign-in link and a one-time code to{" "}
          <strong className="font-medium text-hero-ink">{email}</strong>.
        </p>
      </div>

      {/* In-tab code entry — finishing here keeps the cart (no browser switch) */}
      <div className="space-y-3">
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-hero-line" />
          <span className="text-xs text-hero-ink-muted">enter the code to stay here</span>
          <div className="h-px flex-1 bg-hero-line" />
        </div>
        <OtpCodeForm email={email} redirectTo={redirectTo} />
        <p className="text-center text-xs leading-relaxed text-hero-ink-muted">
          Prefer the link? Tap it in the email — just note it may open a new browser.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-2xl border-hero-line bg-hero-card font-medium text-hero-ink hover:border-hero-clay/60 hover:bg-hero-clay/10"
          onClick={handleResend}
          disabled={isPending || countdown > 0}
        >
          {resendLabel}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm text-primary underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>

      {showSpamHint && (
        <m.p
          initial={shouldAnimate ? { opacity: 0, y: 4 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
          className="rounded-xl bg-hero-clay/[0.06] px-4 py-2.5 text-center text-xs text-hero-ink-muted"
        >
          Don&apos;t see it? Check your spam or promotions folder.
        </m.p>
      )}
    </div>
  );
}
