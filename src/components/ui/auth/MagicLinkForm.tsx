"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { m } from "framer-motion";
import { Mail } from "lucide-react";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type MagicLinkFormValues = z.infer<typeof schema>;

interface MagicLinkFormProps {
  onSuccess: (email: string) => void;
  /** Where to redirect after login (forwarded through auth callback) */
  redirectTo?: string;
}

export function MagicLinkForm({ onSuccess, redirectTo }: MagicLinkFormProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isPending, startTransition] = useTransition();
  const [isShaking, setIsShaking] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MagicLinkFormValues>({
    resolver: zodResolver(schema),
  });

  const errorMessage = errors.email?.message ?? errors.root?.message;

  const triggerShake = () => {
    if (!shouldAnimate) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const onSubmit = (data: MagicLinkFormValues) => {
    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("email", data.email);
        if (redirectTo) formData.set("redirectTo", redirectTo);
        const result = await signInWithMagicLink(formData);
        if (result?.error) {
          setError("root", { message: result.error });
          triggerShake();
          return;
        }
        onSuccess(data.email);
      })();
    });
  };

  const handleInvalid = () => {
    triggerShake();
  };

  const buttonLabel = isPending ? "Sending magic link\u2026" : "Send magic link";

  const buttonProgress = useMemo(() => {
    if (!isPending) return null;
    return (
      <m.span
        className="absolute inset-0 bg-gradient-to-r from-primary via-primary-hover to-primary opacity-80 rounded-[inherit]"
        style={{ transformOrigin: "left" }}
        animate={shouldAnimate ? { scaleX: [0, 1] } : { scaleX: 1 }}
        transition={
          shouldAnimate ? { duration: 1.5, repeat: Infinity, ease: "linear" } : { duration: 0 }
        }
      />
    );
  }, [isPending, shouldAnimate]);

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-5">
      <m.div
        animate={isShaking ? { x: [0, -8, 8, -4, 4, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="space-y-1.5"
      >
        <div className="group relative">
          {/* Icon */}
          <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-hero-ink-muted transition-colors duration-200 group-focus-within:text-hero-clay">
            <Mail className="h-4.5 w-4.5" />
          </div>

          <input
            id="email"
            type="email"
            placeholder=" "
            autoComplete="email"
            className={cn(
              "peer w-full rounded-2xl border border-hero-line bg-hero-card pb-2 pl-11 pr-4 pt-6 text-base text-hero-ink",
              "transition-all duration-200",
              "focus:border-hero-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/30",
              errorMessage && "border-status-error ring-2 ring-status-error/20"
            )}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "email-error" : undefined}
            {...register("email")}
          />
          <label
            htmlFor="email"
            className={cn(
              "absolute left-11 top-1/2 -translate-y-1/2 text-sm text-hero-ink-muted",
              "pointer-events-none transition-all duration-200",
              "peer-focus:top-3 peer-focus:text-xs peer-focus:font-medium peer-focus:text-hero-clay",
              "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
            )}
          >
            Email address
          </label>
        </div>
        {errorMessage && (
          <p id="email-error" className="pl-1 text-sm text-status-error">
            {errorMessage}
          </p>
        )}
      </m.div>

      <MagneticButton className="w-full" radiusClass="rounded-2xl">
        <Button
          type="submit"
          className="relative h-12 w-full overflow-hidden rounded-2xl text-base font-semibold shadow-elevated"
          disabled={isPending}
        >
          {buttonProgress}
          <span className="relative z-10">{buttonLabel}</span>
        </Button>
      </MagneticButton>

      {/* Trust signal */}
      <p className="text-center text-sm text-hero-ink-muted">Trusted by local families</p>

      <p className="text-center text-xs leading-relaxed text-hero-ink-muted">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-2 transition-colors hover:text-hero-ink"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-2 transition-colors hover:text-hero-ink"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
