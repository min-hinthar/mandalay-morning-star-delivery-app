import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  const error = new Error("Sentry test error - API route");

  Sentry.captureException(error, {
    tags: { test: "sentry-debug" },
    extra: { timestamp: new Date().toISOString() },
  });

  return NextResponse.json(
    { error: "Test error sent to Sentry" },
    { status: 500 }
  );
}
