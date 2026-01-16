"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { ReactElement } from "react";

export type UserRole = "customer" | "admin" | "driver" | null;

interface NavLink {
  href: string;
  label: string;
  roles: UserRole[];
}

const navLinks: NavLink[] = [
  { href: "/menu", label: "Menu", roles: ["customer", "admin", "driver", null] },
  { href: "/orders", label: "Orders", roles: ["customer", "admin", "driver"] },
  { href: "/admin", label: "Admin", roles: ["admin"] },
  { href: "/driver", label: "Driver", roles: ["driver"] },
];

interface NavLinksProps {
  role: UserRole;
  className?: string;
  onLinkClick?: () => void;
}

export function NavLinks({ role, className, onLinkClick }: NavLinksProps): ReactElement {
  const pathname = usePathname();

  const visibleLinks = navLinks.filter((link) => link.roles.includes(role));

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {visibleLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
