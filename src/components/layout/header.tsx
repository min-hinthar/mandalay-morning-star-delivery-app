import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/auth/user-menu";
import { NavLinks, type UserRole } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import type { ReactElement } from "react";

async function getUserRole(userId: string | undefined): Promise<UserRole> {
  if (!userId) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile?.role) return "customer";
  return profile.role as UserRole;
}

export async function Header(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = await getUserRole(user?.id);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-base font-display text-brand-red sm:text-lg hover:opacity-80 transition-opacity"
        >
          Mandalay Morning Star
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <NavLinks role={role} />
          <div className="h-6 w-px bg-border" />
          <UserMenu user={user} />
        </div>

        {/* Mobile menu and user menu */}
        <div className="flex items-center gap-2 md:hidden">
          <UserMenu user={user} />
          <MobileMenu role={role} />
        </div>
      </div>
    </header>
  );
}
