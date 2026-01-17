"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: "admin-error-boundary" },
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
          <CardTitle className="text-xl">Admin Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            An error occurred in the admin panel. This has been reported to our team.
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
              <Link href="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
