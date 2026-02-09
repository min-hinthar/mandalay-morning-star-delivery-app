"use client";

import { useEffect, useState, useTransition } from "react";
import { useAnimate, m } from "framer-motion";
import { Mail } from "lucide-react";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface MagicLinkConfirmationProps {
  email: string;
  onBack: () => void;
}

export function MagicLinkConfirmation({ email, onBack }: MagicLinkConfirmationProps) {
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
      await animate(
        "#envelope",
        { y: [50, 0], opacity: [0, 1] },
        { duration: 0.6, ease: "easeOut" }
      );

      if (!isActive) return;

      animate(
        "#envelope",
        { scale: [1, 1.05, 1] },
        { duration: 2, repeat: Infinity, ease: "easeInOut" }
      );
      animate(
        "#glow",
        { opacity: [0.3, 0.6, 0.3] },
        { duration: 2, repeat: Infinity, ease: "easeInOut" }
      );
    };

    void runAnimation();

    return () => {
      isActive = false;
    };
  }, [animate, shouldAnimate]);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSpamHint(true), 18000);
    return () => clearTimeout(timeout);
  }, []);

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
      <div className="flex justify-center">
        <div className="relative">
          <div
            id="glow"
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl opacity-40"
            aria-hidden="true"
          />
          <div
            id="envelope"
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-surface-secondary text-primary"
          >
            <Mail className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-text-primary">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a magic link to <strong className="text-text-primary">{email}</strong>.
          Click the link in your email to sign in.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          className="w-full"
          onClick={handleResend}
          disabled={isPending || countdown > 0}
        >
          {resendLabel}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary hover:underline w-full"
        >
          Use a different email
        </button>
      </div>

      {showSpamHint && (
        <m.p
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: 1 }}
          className="text-xs text-muted-foreground text-center"
        >
          Don&apos;t see it? Check your spam folder.
        </m.p>
      )}
    </div>
  );
}
