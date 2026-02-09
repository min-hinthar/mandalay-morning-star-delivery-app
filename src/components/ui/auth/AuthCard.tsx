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
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: getSpring(spring.gentle),
      }
    : { initial: false, animate: { opacity: 1, y: 0 } };

  const showHeader = state !== "success";

  return (
    <AuthCardContext.Provider value={contextValue}>
      <m.div
        {...cardMotion}
        className={cn(
          "w-full sm:max-w-md",
          "bg-surface-primary sm:bg-surface-primary/70 sm:backdrop-blur-xl",
          "rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl",
          className
        )}
      >
        <div className="h-1 bg-gradient-to-r from-primary via-brand-golden to-primary rounded-t-2xl" />
        <div className="p-6 sm:p-8">
          {showHeader && (
            <div className="flex flex-col items-center text-center">
              <m.div className="flex flex-col items-center gap-3" layoutId="app-logo">
                <Image
                  src="/logo.png"
                  alt="Mandalay Morning Star"
                  width={72}
                  height={72}
                  priority
                  className="h-16 w-16"
                />
                <div>
                  <p className="text-lg font-display font-semibold text-text-primary">
                    Mandalay Morning Star
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Burmese kitchen • Saturday delivery
                  </p>
                </div>
              </m.div>
              <h1 className="mt-6 text-2xl font-display font-semibold text-text-primary">
                {headingCopy[state]}
              </h1>
            </div>
          )}
          <AnimatePresence mode="wait">
            <m.div
              key={state}
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
              transition={shouldAnimate ? getSpring(spring.gentle) : undefined}
              className={showHeader ? "mt-6" : undefined}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </div>
      </m.div>
    </AuthCardContext.Provider>
  );
}
