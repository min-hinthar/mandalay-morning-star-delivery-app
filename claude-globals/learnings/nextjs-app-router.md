# Next.js App Router Build Patterns

## Module-Scope Init Crashes During SSG Page Data Collection

**Context:** CI build failed at "Collecting page data" — `createClient()` called at module top-level in Route Handlers threw because `NEXT_PUBLIC_SUPABASE_URL` wasn't set.

**Learning:** Next.js App Router imports ALL route handler modules during build (even API routes) for page data collection. Any module-scope code that requires env vars will crash in CI or any build environment without those vars.

```typescript
// BAD: crashes during build when env vars are absent
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const data = await supabaseAdmin.from('table').select();
}

// GOOD: lazy init inside handler — only runs at request time
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const data = await supabaseAdmin.from('table').select();
}
```

Also applies to `webPush.setVapidDetails()` and similar SDK config calls — wrap in a function, call inside handler.

**Apply when:** Writing App Router Route Handlers that use any SDK requiring env vars at init time.

---

## Shared Client Modules Kill SSG via Layout Import Chain

**Context:** After fixing route handlers, build failed at "Generating static pages" for `/_not-found`. The shared `supabaseClient.ts` threw `"Missing Supabase environment variables"` at module scope. The not-found page itself doesn't use Supabase, but the root layout imports ClientProviders which imports auth context which imports the client.

**Learning:** SSG pages render the full layout tree. If ANY module in that tree throws at import time, static generation fails. For shared singleton clients, use build-safe placeholders:

```typescript
// BAD: throws at import time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('Missing Supabase environment variables');

// GOOD: creates inert client during build (never called during SSG)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  { auth: { persistSession: true } }
);
```

The placeholder client initializes without error but won't make real API calls. Since SSG pages don't actually invoke Supabase methods, this is safe.

**Apply when:** Any App Router project with shared client modules imported through layouts, deployed in CI without env vars.
