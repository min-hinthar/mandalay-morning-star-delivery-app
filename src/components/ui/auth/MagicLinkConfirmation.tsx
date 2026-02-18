"use client";

import { useEffect, useState, useTransition } from "react";
import { useAnimate, m } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

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
  const { toast } = useToast();
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
            title: "Could not resend",
            description: result.error,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Magic link resent",
          description: "Check your inbox for the new link.",
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
          {/* Golden glow behind */}
          <div
            id="envelope-glow"
            className="absolute -inset-4 rounded-full blur-2xl opacity-30"
            style={{
              background: "radial-gradient(circle, hsla(40, 80%, 60%, 0.6), transparent 70%)",
            }}
            aria-hidden="true"
          />

          {/* Sparkle accents */}
          {shouldAnimate &&
            SPARKLE_POSITIONS.map((pos, i) => (
              <m.div
                key={i}
                className="absolute text-secondary z-10"
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
            className="relative flex h-22 w-22 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 text-primary"
          >
            <Mail className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-xl font-display font-bold text-text-primary">Check your email</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We sent a magic link to <strong className="text-text-primary font-medium">{email}</strong>
          .
          <br />
          Click the link to sign in instantly.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full h-11 rounded-2xl font-medium"
          onClick={handleResend}
          disabled={isPending || countdown > 0}
        >
          {resendLabel}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary hover:underline underline-offset-2 w-full text-center"
        >
          Use a different email
        </button>
      </div>

      {showSpamHint && (
        <m.p
          initial={shouldAnimate ? { opacity: 0, y: 4 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
          className="text-xs text-muted-foreground text-center bg-surface-secondary/50 rounded-xl px-4 py-2.5"
        >
          Don&apos;t see it? Check your spam or promotions folder.
        </m.p>
      )}
    </div>
  );
}
