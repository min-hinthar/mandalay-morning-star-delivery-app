"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function SentryTestPage() {
  const triggerClientError = () => {
    throw new Error("Sentry test error - client side");
  };

  const triggerSentryCapture = () => {
    Sentry.captureException(new Error("Sentry test error - manual capture"));
    alert("Error sent to Sentry via captureException");
  };

  const triggerApiError = async () => {
    const response = await fetch("/api/debug/sentry");
    const data = await response.json();
    alert(data.error || "API error triggered - check Sentry");
  };

  return (
    <div className="container max-w-md py-12 space-y-6">
      <h1 className="text-2xl font-bold">Sentry Test Page</h1>
      <p className="text-muted-foreground">
        Use these buttons to verify Sentry error tracking is working.
      </p>

      <div className="space-y-4">
        <Button onClick={triggerClientError} variant="destructive" className="w-full">
          Trigger Client Error (throws)
        </Button>

        <Button onClick={triggerSentryCapture} variant="outline" className="w-full">
          Trigger Manual Capture
        </Button>

        <Button onClick={triggerApiError} variant="outline" className="w-full">
          Trigger API Error
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        After triggering, check your Sentry dashboard for the error.
      </p>
    </div>
  );
}
