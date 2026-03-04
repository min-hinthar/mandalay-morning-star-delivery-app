import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const timings: Record<string, number> = {};

  try {
    // Step 1: cookies()
    const cookieStore = await cookies();
    timings.cookies_ms = Date.now() - start;

    // Step 2: createServerClient
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              /* Server Component - ignore */
            }
          },
        },
        global: {
          fetch: (url, init) =>
            fetch(url, { ...init, signal: AbortSignal.timeout(5000) }),
        },
      },
    );
    timings.client_ms = Date.now() - start;

    // Step 3: auth.getUser() with hard timeout
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GETUSER_TIMEOUT_8S")), 8000),
      ),
    ]);
    timings.getUser_ms = Date.now() - start;

    return Response.json({
      timings,
      user: result.data?.user?.id ?? null,
      error: result.error?.message ?? null,
      ok: true,
    });
  } catch (error: unknown) {
    timings.error_ms = Date.now() - start;
    return Response.json(
      {
        timings,
        error: error instanceof Error ? error.message : String(error),
        ok: false,
      },
      { status: 500 },
    );
  }
}
