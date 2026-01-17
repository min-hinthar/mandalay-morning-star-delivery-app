"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: "global-error-boundary" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-lotus/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-brand-red" />
          </div>
          <CardTitle className="text-xl text-charcoal">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>

          {process.env.NODE_ENV === "development" && (
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
              {error.message}
            </pre>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild>
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
