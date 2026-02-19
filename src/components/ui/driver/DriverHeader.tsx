/**
 * V6 Driver Header Component - Pepper Aesthetic
 *
 * Sticky header for driver app with V6 colors and high-contrast support.
 * Features back navigation, title, avatar with dropdown, and custom right content.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useDriverAvatar } from "./DriverAvatarContext";
import { InitialsAvatar } from "./InitialsAvatar";

interface DriverHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function DriverHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  rightContent,
  className,
}: DriverHeaderProps) {
  const router = useRouter();
  const { avatarUrl, driverName } = useDriverAvatar();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const hasAvatar = avatarUrl || driverName;

  return (
    <header
      className={cn(
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        // DriverHeader is mobile-only, so no blur at all
        "sticky top-0 z-20 flex min-h-[56px] items-center justify-between border-b border-border bg-surface-primary px-4 py-3",
        className
      )}
    >
      {/* Left side - back button or spacer */}
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-fast hover:bg-surface-tertiary active:bg-surface-secondary"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-text-primary" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="font-display text-lg font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="font-body text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>

      {/* Right side - avatar + custom content */}
      <div className="flex items-center gap-2">
        {rightContent}

        {hasAvatar && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center justify-center rounded-full transition-transform duration-fast hover:scale-105 active:scale-95"
              aria-label="Profile menu"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={driverName || "Driver"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover border border-border"
                  unoptimized
                />
              ) : (
                <InitialsAvatar name={driverName} size="sm" />
              )}
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-surface-primary shadow-lg py-1 z-50">
                <Link
                  href="/driver/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <User className="h-4 w-4 text-text-muted" />
                  Profile
                </Link>
                <hr className="my-1 border-border" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-status-error hover:bg-surface-secondary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
