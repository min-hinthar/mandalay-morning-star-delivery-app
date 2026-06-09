"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

export type AuthState = "form" | "confirmation" | "success" | "error";

interface AuthCardContextValue {
  state: AuthState;
  setState: (state: AuthState) => void;
  email: string;
  setEmail: (email: string) => void;
  errorMessage: string;
  setErrorMessage: (msg: string) => void;
}

const AuthCardContext = createContext<AuthCardContextValue | undefined>(undefined);

export function useAuthCard(): AuthCardContextValue {
  const context = useContext(AuthCardContext);
  if (!context) {
    throw new Error("useAuthCard must be used within AuthCard");
  }
  return context;
}

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

const headingCopy: Record<AuthState, string> = {
  form: "Welcome back",
  confirmation: "Check your inbox",
  success: "Welcome",
  error: "Something went wrong",
};

const subheadingCopy: Record<AuthState, string> = {
  form: "Sign in to your Mandalay Morning Star account",
  confirmation: "We sent you a magic link",
  success: "",
  error: "Let\u2019s try that again",
};

export function AuthCard({ children, className }: AuthCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [state, setState] = useState<AuthState>("form");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const contextValue = useMemo(
    () => ({
      state,
      setState,
      email,
      setEmail,
      errorMessage,
      setErrorMessage,
    }),
    [state, email, errorMessage]
  );

  const cardMotion = shouldAnimate
    ? {
        initial: { opacity: 0, y: 24, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: getSpring(spring.gentle),
      }
    : { initial: false, animate: { opacity: 1, y: 0, scale: 1 } };

  const showHeader = state !== "success";

  return (
    <AuthCardContext.Provider value={contextValue}>
      <m.div
        {...cardMotion}
        className={cn(
          "relative w-full overflow-hidden sm:max-w-md",
          /* Warm-paper card — constant cream in both themes (opaque, no blur) */
          "hero-surface-paper rounded-t-3xl sm:rounded-3xl",
          /* Soft two-tier diffuse shadow so it reads as a gently-lifted panel */
          "shadow-[0_2px_10px_-4px_rgba(20,20,19,0.18),0_24px_60px_-28px_rgba(20,20,19,0.4)]",
          className
        )}
      >
        {/* Layered backdrop — dot-grid + grain + corner ticks + clay edge-glow */}
        <HeroCardLayers accent="clay" radius="rounded-3xl" />

        {/* Warm gradient accent bar */}
        <div className="relative h-1.5 bg-gradient-to-r from-hero-clay via-hero-gold to-hero-clay" />

        <div className="relative p-7 sm:p-9">
          {showHeader && (
            <div className="flex flex-col items-center text-center">
              {/* Compact bilingual masthead — mobile/tablet only (desktop uses the
                  AuthBrandPanel). Keeps the logo + layoutId for the success morph. */}
              <m.div className="flex flex-col items-center gap-2.5 lg:hidden" layoutId="app-logo">
                <div className="relative">
                  {/* Gold halo — radial-gradient falloff (no blur, iOS-safe) */}
                  <div
                    className="absolute -inset-2 rounded-full opacity-60"
                    style={{
                      background: "radial-gradient(circle, var(--hero-gold), transparent 68%)",
                    }}
                    aria-hidden="true"
                  />
                  <Image
                    src="/logo.png"
                    alt="Mandalay Morning Star"
                    width={80}
                    height={53}
                    priority
                    className="relative h-16 w-16 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 text-hero-clay">
                  <HeroSunburst className="h-4 w-4" rays={8} />
                  <p className="font-display text-lg font-bold tracking-tight text-hero-ink">
                    Mandalay Morning Star
                  </p>
                </div>
                <p lang="my" className="font-burmese text-xs leading-relaxed text-hero-ink-muted">
                  မြန်မာ အရသာ · LA အိမ်ရောက်ပို့ဆောင်
                </p>
              </m.div>

              <AnimatePresence mode="wait">
                <m.div
                  key={state}
                  initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldAnimate ? { opacity: 0, y: -4 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="mt-7 lg:mt-0"
                >
                  <h1 className="text-2xl font-display font-bold text-hero-ink">
                    {headingCopy[state]}
                  </h1>
                  {subheadingCopy[state] && (
                    <p className="mt-1.5 text-sm text-hero-ink-muted">{subheadingCopy[state]}</p>
                  )}
                </m.div>
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence mode="wait">
            <m.div
              key={state}
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
              transition={shouldAnimate ? getSpring(spring.gentle) : undefined}
              className={showHeader ? "mt-8" : undefined}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </div>
      </m.div>
    </AuthCardContext.Provider>
  );
}
