"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

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
          "w-full sm:max-w-md",
          /* Solid on mobile, glass on desktop (Safari crash prevention) */
          "bg-surface-primary sm:bg-surface-primary/70 sm:backdrop-blur-xl",
          "rounded-t-3xl sm:rounded-3xl overflow-hidden",
          /* Layered shadows for depth */
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]",
          /* Subtle border glow */
          "ring-1 ring-white/30 dark:ring-white/10",
          className
        )}
      >
        {/* Warm gradient accent bar */}
        <div
          className="h-1.5"
          style={{ background: "linear-gradient(to right, var(--hero-bg-start), var(--hero-bg-mid), var(--hero-bg-end))" }}
        />

        <div className="p-7 sm:p-9">
          {showHeader && (
            <div className="flex flex-col items-center text-center">
              <m.div
                className="flex flex-col items-center gap-3"
                layoutId="app-logo"
              >
                {/* Logo with soft golden glow */}
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{ background: "radial-gradient(circle, hsla(40, 80%, 60%, 0.5), transparent 70%)" }}
                    aria-hidden="true"
                  />
                  <Image
                    src="/logo.png"
                    alt="Mandalay Morning Star"
                    width={80}
                    height={53}
                    priority
                    className="relative h-18 w-18 object-contain"
                  />
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-text-primary tracking-tight">
                    Mandalay Morning Star
                  </p>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase">
                    Burmese kitchen &bull; Saturday delivery
                  </p>
                </div>
              </m.div>

              <AnimatePresence mode="wait">
                <m.div
                  key={state}
                  initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldAnimate ? { opacity: 0, y: -4 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="mt-7"
                >
                  <h1 className="text-2xl font-display font-bold text-text-primary">
                    {headingCopy[state]}
                  </h1>
                  {subheadingCopy[state] && (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {subheadingCopy[state]}
                    </p>
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
