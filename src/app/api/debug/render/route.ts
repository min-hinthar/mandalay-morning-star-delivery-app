import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Debug route that simulates the customer layout flow step by step.
 * Tests: cookies → createClient → auth.getUser → getBusinessRules
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step") ?? "all";
  const start = Date.now();
  const timings: Record<string, number> = {};

  try {
    // Step 1: Raw cookies
    if (step === "cookies" || step === "all") {
      const cookieStore = await cookies();
      timings.cookies_ms = Date.now() - start;
      timings.cookie_count = cookieStore.getAll().length;
    }

    // Step 2: createClient (our wrapper)
    if (step === "client" || step === "all") {
      const supabase = await createClient();
      timings.createClient_ms = Date.now() - start;

      // Step 3: auth.getUser
      const { data, error } = await supabase.auth.getUser();
      timings.getUser_ms = Date.now() - start;
      timings.has_user = data.user ? 1 : 0;
      timings.auth_error = error ? 1 : 0;
    }

    // Step 4: getBusinessRules (uses unstable_cache)
    if (step === "rules" || step === "all") {
      const { getBusinessRules } = await import("@/lib/settings");
      const rules = await getBusinessRules();
      timings.businessRules_ms = Date.now() - start;
      timings.has_rules = rules ? 1 : 0;
    }

    // Step 5: Test redirect() behavior
    if (step === "redirect") {
      const { redirect } = await import("next/navigation");
      redirect("/api/debug/auth"); // Should produce a 307
    }

    return Response.json({ timings, total_ms: Date.now() - start, ok: true });
  } catch (error: unknown) {
    timings.error_ms = Date.now() - start;
    return Response.json(
      {
        timings,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5) : undefined,
        ok: false,
      },
      { status: 500 },
    );
  }
}
