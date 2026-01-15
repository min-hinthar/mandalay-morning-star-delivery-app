"use client";

import { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactElement } from "react";

interface UserMenuProps {
  user: User | null;
}

export function UserMenu({ user }: UserMenuProps): ReactElement {
  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" className="bg-primary hover:bg-brand-red-dark">
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
