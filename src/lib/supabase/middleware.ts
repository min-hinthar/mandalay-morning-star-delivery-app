import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Auth-only customer routes — mirrors the (customer) route group's layout guard. */
const CUSTOMER_PROTECTED_PATHS = ["/checkout", "/cart", "/orders", "/account"];

/**
 * Refresh Supabase auth session on every request and gate
 * /admin + /driver routes for unauthenticated users.
 *
 * CRITICAL: No code between createServerClient() and getUser().
 * No DB queries — role checks happen in layout guards.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured."
    );
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // CRITICAL: Do not put code between createServerClient and getUser().
  // Atomic session refresh — reads cookies, validates token, writes refreshed cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate protected routes for unauthenticated users. Customer paths carry
  // ?next= too: the (customer) layout's own redirect("/login") has no access
  // to the request path, so a guest tapping "Proceed to Checkout" used to land
  // on /login without a destination and get dumped back on /menu after signing
  // in — cart intact but checkout intent gone. Redirecting here (with next=)
  // runs before that layout guard, which stays as a belt.
  const path = request.nextUrl.pathname;
  const isCustomerProtected = CUSTOMER_PROTECTED_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  if (!user && (path.startsWith("/admin") || path.startsWith("/driver") || isCustomerProtected)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return supabaseResponse (not a new NextResponse) to preserve cookie writes
  return supabaseResponse;
}
