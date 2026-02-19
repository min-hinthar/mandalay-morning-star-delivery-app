"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthBackground } from "./AuthBackground";

interface CallbackSpinnerProps {
  message: string;          // "Loading your driver dashboard..."
  redirectTo: string;       // "/driver"
  timeoutMs?: number;       // default 5000
}

export function CallbackSpinner({ message, redirectTo, timeoutMs = 5000 }: CallbackSpinnerProps) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <AuthBackground>
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
          <p className="text-sm text-destructive font-medium">Something took too long.</p>
          <button
            type="button"
            onClick={() => router.replace(redirectTo)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-text-primary underline underline-offset-2 transition-colors"
          >
            Back to login
          </a>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div
        className="flex flex-col items-center justify-center gap-4 text-center p-8"
        aria-busy="true"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      </div>
    </AuthBackground>
  );
}
