"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorMascot } from "@/components/ui/error-pages";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

/* A stale tab after a deploy (version skew) or a flaky mobile network surfaces
   as a failed lazy-chunk fetch. `reset()` can't fix it — only a hard reload
   refetches the document and the fresh build manifest. */
const CHUNK_RELOAD_AT_KEY = "mms-chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /Failed to load chunk|Loading chunk \S+ failed|error loading dynamically imported module|Importing a module script failed/i.test(
      error.message
    )
  );
}

/** One auto-reload per cooldown window; false when storage is blocked or we
    reloaded recently (prevents a reload loop on a persistent failure). */
function tryMarkAutoReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_AT_KEY) ?? 0);
    if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(CHUNK_RELOAD_AT_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

export function RouteError({ error, reset, context }: RouteErrorProps) {
  const retryCount = useRef(0);
  const [showHomeEmphasis, setShowHomeEmphasis] = useState(false);
  const chunkError = isChunkLoadError(error);
  const [autoReloading, setAutoReloading] = useState(false);

  useEffect(() => {
    logger.error("Route error boundary caught error", {
      api: `route-error-${context ?? "unknown"}`,
    });
    Sentry.captureException(error, {
      tags: { location: `route-error-${context ?? "unknown"}`, chunk_load: String(chunkError) },
      extra: { digest: error.digest },
    });
  }, [error, context, chunkError]);

  /* Self-heal chunk failures: hard-reload once to fetch the fresh build. */
  useEffect(() => {
    if (!chunkError) return;
    if (tryMarkAutoReload()) {
      setAutoReloading(true);
      window.location.reload();
    }
  }, [chunkError]);

  function handleRetry() {
    retryCount.current += 1;
    if (retryCount.current >= 2) {
      setShowHomeEmphasis(true);
    }
    if (chunkError) {
      // reset() would re-request the same dead chunk URL — reload instead.
      window.location.reload();
      return;
    }
    reset();
  }

  if (autoReloading) {
    return (
      <div className="animate-fade-in-up flex min-h-[60vh] items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center" role="status">
          <Image
            src="/logo.png"
            alt="Morning Star"
            width={48}
            height={32}
            className="mx-auto mb-4"
          />
          <RefreshCw
            className="motion-safe:animate-spin-slow mx-auto mb-3 h-6 w-6 text-primary"
            aria-hidden="true"
          />
          <h1 className="font-display mb-2 text-xl text-text-primary">Getting the fresh batch…</h1>
          <p className="text-sm text-text-secondary">
            A new version just landed — reloading the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up min-h-[60vh] bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Image src="/logo.png" alt="Morning Star" width={48} height={32} className="mx-auto mb-4" />
        <div className="mb-6">
          <ErrorMascot errorType="server-error" />
        </div>
        <h1 className="text-xl font-display text-text-primary mb-2">
          {chunkError ? "Lost a bite on the way" : "Kitchen meltdown!"}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {chunkError
            ? "Part of the page didn't make it over — check your connection and try again."
            : context
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
