"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorMascot } from "@/components/ui/error-pages";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function RouteError({ error, reset, context }: RouteErrorProps) {
  const retryCount = useRef(0);
  const [showHomeEmphasis, setShowHomeEmphasis] = useState(false);

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error, {
      tags: { location: `route-error-${context ?? "unknown"}` },
      extra: { digest: error.digest },
    });
  }, [error, context]);

  function handleRetry() {
    retryCount.current += 1;
    if (retryCount.current >= 2) {
      setShowHomeEmphasis(true);
    }
    reset();
  }

  return (
    <div className="animate-fade-in-up min-h-[60vh] bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Image src="/logo.png" alt="Morning Star" width={48} height={32} className="mx-auto mb-4" />
        <div className="mb-6">
          <ErrorMascot errorType="server-error" />
        </div>
        <h1 className="text-xl font-display text-text-primary mb-2">Kitchen meltdown!</h1>
        <p className="text-sm text-text-secondary mb-6">
          {context
            ? `The ${context} fell off the tray. Give it another shot!`
            : "Something boiled over in the kitchen. Give it another shot!"}
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-surface-tertiary p-3 rounded-md overflow-auto max-h-24 mb-6 text-left">
            {error.message}
            {error.stack && "\n\n" + error.stack}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleRetry}
            variant={showHomeEmphasis ? "outline" : "default"}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button asChild variant={showHomeEmphasis ? "default" : "ghost"} size="sm">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
