# Task: V0-003 — Supabase Auth Integration

> **Priority**: P0 (Blocking)
> **Milestone**: V0 — Skeleton
> **Depends On**: V0-002 (Database Schema)
> **Branch**: `project-init`

---

## Objective

Implement complete authentication flow using Supabase Auth with email/password. Users should be able to sign up, log in, log out, and have their session persist. Profile is auto-created on signup via the database trigger from V0-002.

---

## Acceptance Criteria

- [x] Login page at `/login` with email/password form
- [x] Signup page at `/signup` with email/password/confirm form
- [x] User can sign up with email and receive confirmation
- [x] User can log in with credentials
- [x] User can log out
- [x] Profile auto-created on signup (via V0-002 trigger)
- [x] Session persists across page refresh
- [x] Protected routes redirect to `/login`
- [x] Auth'd users on `/login` redirect to home
- [x] Password reset flow (request + update)
- [x] Form validation with error messages
- [x] Loading states during auth operations

---

## Technical Specification

### 1. Auth Actions (Server Actions)

Create `src/lib/supabase/actions.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email to confirm your account" };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for reset instructions" };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
```

### 2. Auth Callback Route

Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
```

### 3. Login Page

Update `src/app/(auth)/login/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect if already logged in
  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-brand-red">Welcome Back</h1>
          <p className="mt-2 text-muted">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
```

### 4. Login Form Component

Create `src/components/auth/login-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signIn } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-brand-red hover:bg-brand-red-dark" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-brand-red hover:underline">
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <p className="text-sm text-center text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-red hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### 5. Signup Page

Update `src/app/(auth)/signup/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-brand-red">Create Account</h1>
          <p className="mt-2 text-muted">Join Mandalay Morning Star</p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
```

### 6. Signup Form Component

Create `src/components/auth/signup-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signUp } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-brand-red hover:bg-brand-red-dark" disabled={pending}>
      {pending ? "Creating account..." : "Create Account"}
    </Button>
  );
}

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    }
    if (result?.success) {
      setSuccess(result.success);
    }
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              minLength={8}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <p className="text-sm text-center text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-red hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### 7. Update Middleware

Update `src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes - require auth
  const protectedPaths = ["/cart", "/checkout", "/orders"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 8. Auth Components Directory

Create `src/components/auth/index.ts`:

```typescript
export { LoginForm } from "./login-form";
export { SignupForm } from "./signup-form";
```

### 9. User Menu Component (Header)

Create `src/components/auth/user-menu.tsx`:

```typescript
"use client";

import { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UserMenuProps {
  user: User | null;
}

export function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" className="bg-brand-red hover:bg-brand-red-dark">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted">{user.email}</span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
```

---

## Test Plan

### Manual Testing

1. **Signup Flow**
   - Go to `/signup`
   - Enter email, password, confirm password
   - Submit → check email for confirmation link
   - Click link → redirected to app
   - Check `profiles` table → new row created

2. **Login Flow**
   - Go to `/login`
   - Enter valid credentials
   - Submit → redirected to home
   - Refresh page → still logged in

3. **Logout Flow**
   - Click sign out
   - Redirected to `/login`
   - Try accessing `/cart` → redirected to `/login`

4. **Protected Routes**
   - While logged out, go to `/cart`
   - Should redirect to `/login?next=/cart`
   - Log in → redirected to `/cart`

5. **Auth'd Redirect**
   - While logged in, go to `/login`
   - Should redirect to `/`

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [x] Login page functional with form validation
2. [x] Signup page functional with password confirmation
3. [x] Auth callback route handles email confirmation
4. [x] Session persists across refresh
5. [x] Protected routes redirect to login
6. [x] Logged-in users redirect from login/signup pages
7. [x] Sign out clears session
8. [x] Profile created automatically on signup
9. [x] Loading states during auth operations
10. [x] Error messages display correctly
11. [x] `pnpm lint` passes
12. [x] `pnpm typecheck` passes
13. [x] `pnpm build` succeeds
14. [x] `docs/project_status.md` updated

---

## Notes for Codex

- Server Actions handle auth to keep credentials server-side
- Use `useFormStatus` for loading states (React 19)
- The profile trigger from V0-002 auto-creates profile row
- Middleware refreshes session on each request
- Protected paths array can be extended for new routes

---

*Task created: 2026-01-12 | Ready for implementation*
