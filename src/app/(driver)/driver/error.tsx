"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DriverErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DriverError({ error, reset }: DriverErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: "driver-error-boundary" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Driver App Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Something went wrong with the driver app. Please try again or contact support.
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
              <Link href="/driver">
                <Truck className="h-4 w-4 mr-2" />
                Driver Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
