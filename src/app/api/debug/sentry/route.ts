import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  // Only allow in development — prevent Sentry quota abuse in production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const error = new Error("Sentry test error - API route");

  Sentry.captureException(error, {
    tags: { test: "sentry-debug" },
    extra: { timestamp: new Date().toISOString() },
  });

  // Flush before returning to ensure event is sent in serverless environment
  await Sentry.flush(2000);

  return NextResponse.json({ error: "Test error sent to Sentry" }, { status: 500 });
}
