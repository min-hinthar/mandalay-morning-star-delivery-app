import type { ServiceStatus, RouteStatus } from "./types";

// ===========================================
// Service Checks & Route Reachability
// ===========================================

// ---- 30-second in-memory cache ----

interface CachedDeepResult {
  data: DeepCheckResult;
  timestamp: number;
}

const CACHE_TTL_MS = 30_000;
let cachedResult: CachedDeepResult | null = null;

// ---- Secret redaction (module-private) ----

function redactSecrets(message: string): string {
  return message
    .replace(/(sk_(?:live|test)_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/(pk_(?:live|test)_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/(re_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/(whsec_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "eyJ***")
    .replace(/(https?:\/\/)[^:]+:[^@]+@/g, "$1***:***@");
}

function errorMessage(err: unknown): string {
  return redactSecrets(err instanceof Error ? err.message : String(err));
}

// ---- Individual service checks ----

export async function checkSupabase(): Promise<ServiceStatus> {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!configured) {
    return { status: "down", configured: false };
  }

  const start = Date.now();
  try {
    const { createPublicClient } = await import("@/lib/supabase/server");
    const supabase = createPublicClient();
    const { error } = await supabase.from("app_settings").select("key").limit(1);

    if (error) {
      return {
        status: "degraded",
        configured: true,
        connected: false,
        latency_ms: Date.now() - start,
        error: redactSecrets(error.message),
      };
    }

    return {
      status: "healthy",
      configured: true,
      connected: true,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "down",
      configured: true,
      connected: false,
      latency_ms: Date.now() - start,
      error: errorMessage(err),
    };
  }
}

export async function checkStripe(): Promise<ServiceStatus> {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);

  if (!configured) {
    return { status: "down", configured: false };
  }

  const start = Date.now();
  try {
    const { stripe } = await import("@/lib/stripe/server");
    await stripe.balance.retrieve();

    return {
      status: "healthy",
      configured: true,
      connected: true,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "down",
      configured: true,
      connected: false,
      latency_ms: Date.now() - start,
      error: errorMessage(err),
    };
  }
}

export async function checkResend(): Promise<ServiceStatus> {
  const configured = Boolean(process.env.RESEND_API_KEY);

  if (!configured) {
    return { status: "down", configured: false };
  }

  const start = Date.now();
  try {
    const { getResendClient } = await import("@/lib/email/client");
    const resend = getResendClient();
    const result = await resend.domains.list();

    if (result.error) {
      return {
        status: "degraded",
        configured: true,
        connected: false,
        latency_ms: Date.now() - start,
        error: redactSecrets(result.error.message),
      };
    }

    return {
      status: "healthy",
      configured: true,
      connected: true,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "down",
      configured: true,
      connected: false,
      latency_ms: Date.now() - start,
      error: errorMessage(err),
    };
  }
}

export async function checkGoogleOAuth(): Promise<ServiceStatus> {
  // Config-only check: verify Supabase env vars for OAuth are present
  // Actual OAuth requires browser interaction -- can't test programmatically
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return {
    status: configured ? "healthy" : "down",
    configured,
  };
}

export async function checkSearchConsole(): Promise<ServiceStatus> {
  // Config-only check: verify verification code env var is set
  const configured = Boolean(process.env.GOOGLE_SITE_VERIFICATION);

  return {
    status: configured ? "healthy" : "down",
    configured,
  };
}

// ---- Route reachability ----

export async function checkRoutes(
  origin: string
): Promise<{ auth_callback: RouteStatus; stripe_webhook: RouteStatus }> {
  const routes = [
    { path: "/auth/callback", key: "auth_callback" as const },
    { path: "/api/webhooks/stripe", key: "stripe_webhook" as const },
  ];

  const results = await Promise.allSettled(
    routes.map(async ({ path }) => {
      try {
        const res = await fetch(`${origin}${path}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        // non-404 = reachable (302 redirect, 405 method not allowed are valid)
        return {
          path,
          reachable: res.status !== 404,
          status_code: res.status,
        } satisfies RouteStatus;
      } catch {
        return { path, reachable: false } satisfies RouteStatus;
      }
    })
  );

  const resolved = results.map((r) =>
    r.status === "fulfilled" ? r.value : ({ path: "", reachable: false } satisfies RouteStatus)
  );

  return {
    auth_callback: resolved[0],
    stripe_webhook: resolved[1],
  };
}

// ---- Orchestrator: run all deep checks ----

interface DeepCheckResult {
  services: {
    supabase: ServiceStatus;
    stripe: ServiceStatus;
    resend: ServiceStatus;
    google_oauth: ServiceStatus;
    search_console: ServiceStatus;
  };
  routes: {
    auth_callback: RouteStatus;
    stripe_webhook: RouteStatus;
  };
}

export async function runDeepChecks(origin: string): Promise<DeepCheckResult> {
  // Return cached result if still valid
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return cachedResult.data;
  }

  const [
    supabaseResult,
    stripeResult,
    resendResult,
    googleOAuthResult,
    searchConsoleResult,
    routesResult,
  ] = await Promise.allSettled([
    checkSupabase(),
    checkStripe(),
    checkResend(),
    checkGoogleOAuth(),
    checkSearchConsole(),
    checkRoutes(origin),
  ]);

  const fallbackService: ServiceStatus = {
    status: "down",
    configured: false,
  };
  const fallbackRoutes = {
    auth_callback: { path: "/auth/callback", reachable: false } as RouteStatus,
    stripe_webhook: {
      path: "/api/webhooks/stripe",
      reachable: false,
    } as RouteStatus,
  };

  const data: DeepCheckResult = {
    services: {
      supabase: supabaseResult.status === "fulfilled" ? supabaseResult.value : fallbackService,
      stripe: stripeResult.status === "fulfilled" ? stripeResult.value : fallbackService,
      resend: resendResult.status === "fulfilled" ? resendResult.value : fallbackService,
      google_oauth:
        googleOAuthResult.status === "fulfilled" ? googleOAuthResult.value : fallbackService,
      search_console:
        searchConsoleResult.status === "fulfilled" ? searchConsoleResult.value : fallbackService,
    },
    routes: routesResult.status === "fulfilled" ? routesResult.value : fallbackRoutes,
  };

  cachedResult = { data, timestamp: Date.now() };
  return data;
}
