"use client";

/**
 * V7 Magic Link Sent - Animated Confirmation Screen
 *
 * Sprint 9: Auth & Onboarding
 * Features: Animated envelope illustration, email reveal,
 * resend countdown, success celebration
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MailOpen,
  CheckCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  v7Spring,
  v7Hover,
} from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface MagicLinkSentProps {
  /** Email address the link was sent to */
  email: string;
  /** Called when user clicks resend */
  onResend?: () => Promise<void>;
  /** Called when user clicks back/close */
  onBack?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATED ENVELOPE
// ============================================

function AnimatedEnvelopeV7({ isOpening }: { isOpening: boolean }) {
  const { shouldAnimate } = useAnimationPreferenceV7();

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Background glow */}
      <motion.div
        animate={
          shouldAnimate
            ? {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }
            : undefined
        }
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-v6-primary/30 to-v6-secondary/30 blur-xl"
      />

      {/* Envelope container */}
      <motion.div
        initial={shouldAnimate ? { scale: 0, rotate: -10 } : undefined}
        animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
        transition={v7Spring.ultraBouncy}
        className="relative"
      >
        {/* Envelope body */}
        <motion.div
          animate={
            shouldAnimate && isOpening
              ? { y: [0, -5, 0], rotate: [0, 3, 0] }
              : undefined
          }
          transition={{ duration: 0.5 }}
          className={cn(
            "relative w-28 h-20 rounded-xl",
            "bg-gradient-to-br from-v6-primary to-v6-primary/80",
            "shadow-xl shadow-v6-primary/30",
            "overflow-hidden"
          )}
        >
          {/* Envelope flap */}
          <motion.div
            animate={
              shouldAnimate && isOpening
                ? { rotateX: -180, y: -5 }
                : { rotateX: 0, y: 0 }
            }
            transition={v7Spring.default}
            style={{ transformOrigin: "top center", perspective: 1000 }}
            className={cn(
              "absolute inset-x-0 top-0 h-10",
              "bg-gradient-to-b from-v6-primary to-v6-primary/90",
              "[clip-path:polygon(0_0,50%_100%,100%_0)]"
            )}
          />

          {/* Inner */}
          <div className="absolute inset-2 top-6 bg-white/10 rounded-lg" />
        </motion.div>

        {/* Letter coming out */}
        <AnimatePresence>
          {isOpening && shouldAnimate && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: -20, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={v7Spring.default}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 top-2",
                "w-20 h-16 rounded-lg",
                "bg-white shadow-lg",
                "flex items-center justify-center"
              )}
            >
              <Sparkles className="w-6 h-6 text-v6-secondary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success check */}
        <AnimatePresence>
          {isOpening && shouldAnimate && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...v7Spring.ultraBouncy, delay: 0.3 }}
              className={cn(
                "absolute -bottom-2 -right-2",
                "w-10 h-10 rounded-full",
                "bg-v6-green",
                "flex items-center justify-center",
                "shadow-lg shadow-v6-green/30"
              )}
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sparkle particles */}
      {shouldAnimate && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.cos((i / 6) * Math.PI * 2) * 60,
                y: Math.sin((i / 6) * Math.PI * 2) * 60,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute w-2 h-2 rounded-full bg-v6-secondary"
            />
          ))}
        </>
      )}
    </div>
  );
}

// ============================================
// EMAIL REVEAL
// ============================================

function EmailRevealV7({ email }: { email: string }) {
  const { shouldAnimate } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.3 }}
      className={cn(
        "inline-flex items-center gap-2",
        "px-4 py-2 rounded-full",
        "bg-v6-surface-secondary",
        "text-v6-text-primary font-medium"
      )}
    >
      <Mail className="w-4 h-4 text-v6-primary" />
      <motion.span
        initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        transition={{ delay: 0.4 }}
      >
        {email}
      </motion.span>
    </motion.div>
  );
}

// ============================================
// RESEND BUTTON
// ============================================

interface ResendButtonV7Props {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
}

function ResendButtonV7({
  onResend,
  cooldownSeconds = 30,
}: ResendButtonV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
  const [countdown, setCountdown] = useState(cooldownSeconds);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle resend
  const handleResend = useCallback(async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    try {
      await onResend();
      setCountdown(cooldownSeconds);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
      }
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, onResend, cooldownSeconds]);

  const canResend = countdown === 0 && !isResending;

  return (
    <motion.button
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      transition={{ delay: 0.6 }}
      onClick={handleResend}
      disabled={!canResend}
      whileHover={shouldAnimate && canResend ? { scale: 1.02 } : undefined}
      whileTap={shouldAnimate && canResend ? { scale: 0.98 } : undefined}
      className={cn(
        "flex items-center gap-2",
        "text-sm transition-colors",
        canResend
          ? "text-v6-primary hover:text-v6-primary/80 cursor-pointer"
          : "text-v6-text-muted cursor-not-allowed"
      )}
    >
      <RefreshCw
        className={cn("w-4 h-4", isResending && "animate-spin")}
      />
      {isResending
        ? "Resending..."
        : countdown > 0
          ? `Resend in ${countdown}s`
          : "Resend link"}
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MagicLinkSent({
  email,
  onResend,
  onBack,
  className,
}: MagicLinkSentProps) {
  const { shouldAnimate } = useAnimationPreferenceV7();
  const [isOpening, setIsOpening] = useState(false);

  // Trigger envelope opening animation
  useEffect(() => {
    const timer = setTimeout(() => setIsOpening(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Open email client
  const handleOpenMail = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    // Try to open default mail client
    window.open("mailto:", "_blank");
  }, []);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      className={cn(
        "flex flex-col items-center text-center",
        "max-w-md mx-auto px-6 py-8",
        className
      )}
    >
      {/* Animated envelope */}
      <div className="mb-8">
        <AnimatedEnvelopeV7 isOpening={isOpening} />
      </div>

      {/* Title */}
      <motion.h1
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-v6-text-primary mb-2"
      >
        Check Your Email
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.2 }}
        className="text-v6-text-secondary mb-4"
      >
        We sent a magic link to
      </motion.p>

      {/* Email */}
      <div className="mb-6">
        <EmailRevealV7 email={email} />
      </div>

      {/* Instructions */}
      <motion.p
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 0.7 } : undefined}
        transition={{ delay: 0.4 }}
        className="text-sm text-v6-text-muted mb-8 max-w-xs"
      >
        Click the link in your email to sign in.
        It&apos;ll expire in 24 hours.
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Open mail button */}
        <motion.button
          {...(shouldAnimate ? v7Hover.scale : {})}
          onClick={handleOpenMail}
          className={cn(
            "inline-flex items-center gap-2",
            "px-6 py-3 rounded-xl",
            "bg-gradient-to-r from-v6-primary to-v6-primary/90",
            "text-white font-semibold",
            "shadow-lg shadow-v6-primary/30",
            "hover:shadow-xl hover:shadow-v6-primary/40",
            "transition-shadow"
          )}
        >
          <MailOpen className="w-5 h-5" />
          Open Email App
          <ExternalLink className="w-4 h-4" />
        </motion.button>

        {/* Resend option */}
        {onResend && <ResendButtonV7 onResend={onResend} />}

        {/* Back link */}
        {onBack && (
          <motion.button
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 0.6 } : undefined}
            transition={{ delay: 0.7 }}
            whileHover={shouldAnimate ? { opacity: 1 } : undefined}
            onClick={onBack}
            className="text-sm text-v6-text-muted hover:text-v6-text-primary transition-colors"
          >
            Try a different email
          </motion.button>
        )}
      </motion.div>

      {/* Check spam note */}
      <motion.p
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 0.4 } : undefined}
        transition={{ delay: 0.8 }}
        className="mt-8 text-xs text-v6-text-muted"
      >
        Can&apos;t find it? Check your spam folder.
      </motion.p>
    </motion.div>
  );
}

export default MagicLinkSent;
