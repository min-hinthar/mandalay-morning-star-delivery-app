"use client";

import { useCallback, type ReactElement } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { DropdownAction } from "@/components/ui/DropdownAction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/lib/hooks/useToast";
import Link from "next/link";

interface UserMenuProps {
  user: User | null;
}

export function UserMenu({ user }: UserMenuProps): ReactElement {
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    await signOut();
    // signOut redirects on success, so we only need to handle errors
  }, []);

  const handleSignOutError = useCallback(
    (error: Error) => {
      toast({
        title: "Sign out failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
    [toast]
  );

  if (!user) {
    return (
      <div className="flex gap-2">
        {/* Desktop Sign In */}
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/login">Sign In</Link>
        </Button>
        {/* Mobile Sign In */}
        <Button variant="ghost" size="icon" asChild className="sm:hidden" aria-label="Sign in">
          <Link href="/login">
            <UserIcon className="h-5 w-5" />
          </Link>
        </Button>
        {/* Sign Up */}
        <Button size="sm" asChild className="hidden sm:block bg-primary hover:bg-brand-red-dark">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 max-w-[200px]"
        >
          <UserIcon className="h-4 w-4 shrink-0" />
          <span className="truncate hidden sm:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownAction
          icon={LogOut}
          onClick={handleSignOut}
          onError={handleSignOutError}
          variant="destructive"
          allowMenuClose
        >
          Sign Out
        </DropdownAction>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
