"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { m } from "framer-motion";
import { signInWithMagicLink } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type MagicLinkFormValues = z.infer<typeof schema>;

interface MagicLinkFormProps {
  onSuccess: (email: string) => void;
}

export function MagicLinkForm({ onSuccess }: MagicLinkFormProps) {
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

  const buttonLabel = isPending ? "Sending magic link..." : "Send magic link";

  const buttonProgress = useMemo(() => {
    if (!isPending) return null;
    return (
      <m.span
        className="absolute inset-0 bg-gradient-to-r from-primary to-primary-hover opacity-90"
        style={{ transformOrigin: "left" }}
        animate={shouldAnimate ? { scaleX: [0, 1] } : { scaleX: 1 }}
        transition={
          shouldAnimate
            ? { duration: 1.2, repeat: Infinity, ease: "linear" }
            : { duration: 0 }
        }
      />
    );
  }, [isPending, shouldAnimate]);

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-6">
      <m.div
        animate={isShaking ? { x: [0, -8, 8, -4, 4, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <label className="text-sm font-medium text-text-primary" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            placeholder=" "
            autoComplete="email"
            className={cn(
              "peer w-full rounded-xl border border-border bg-surface-primary px-4 pt-6 pb-2 text-base",
              "transition-all duration-200",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              errorMessage && "border-status-error"
            )}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "email-error" : undefined}
            {...register("email")}
          />
          <label
            htmlFor="email"
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
              "transition-all duration-200",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary",
              "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
            )}
          >
            Email address
          </label>
        </div>
        {errorMessage && (
          <p id="email-error" className="text-destructive text-sm mt-1">
            {errorMessage}
          </p>
        )}
      </m.div>

      <Button
        type="submit"
        className="relative w-full overflow-hidden"
        disabled={isPending}
      >
        {buttonProgress}
        <span className="relative z-10">{buttonLabel}</span>
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Trusted by local families
      </p>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-text-primary transition-colors">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-text-primary transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
