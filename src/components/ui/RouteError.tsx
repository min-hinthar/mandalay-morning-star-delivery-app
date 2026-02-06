"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function RouteError({ error, reset, context }: RouteErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: `route-error-${context ?? "unknown"}` },
      extra: { digest: error.digest },
    });
  }, [error, context]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="mx-auto w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mb-6"
        >
          <AlertTriangle className="h-8 w-8 text-brand-red" />
        </motion.div>
        <h1 className="text-xl font-display text-charcoal mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {context
            ? `We couldn't load the ${context}. Please try again.`
            : "We encountered an unexpected error. Please try again."}
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-24 mb-6 text-left">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button asChild size="sm">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
