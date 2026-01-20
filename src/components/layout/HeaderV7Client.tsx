"use client";

import React, { useState, useMemo, type ReactElement } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { HeaderV7, HeaderSpacer } from "./v7-index";
import { MobileNavV7 } from "./MobileNavV7";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import type { UserRole } from "./nav-links";
import { Home, UtensilsCrossed, Package, ShieldCheck, Truck } from "lucide-react";

interface HeaderV7ClientProps {
  user: User | null;
  role: UserRole;
}

interface NavConfigItem {
  href: string;
  label: string;
  roles: UserRole[];
  icon: React.ReactNode;
}

const navConfig: NavConfigItem[] = [
  { href: "/", label: "Home", roles: ["customer", "admin", "driver", null], icon: <Home className="w-5 h-5" /> },
  { href: "/menu", label: "Menu", roles: ["customer", "admin", "driver", null], icon: <UtensilsCrossed className="w-5 h-5" /> },
  { href: "/orders", label: "Orders", roles: ["customer", "admin", "driver"], icon: <Package className="w-5 h-5" /> },
  { href: "/admin", label: "Admin", roles: ["admin"], icon: <ShieldCheck className="w-5 h-5" /> },
  { href: "/driver", label: "Driver", roles: ["driver"], icon: <Truck className="w-5 h-5" /> },
];

export function HeaderV7Client({ user, role }: HeaderV7ClientProps): ReactElement {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { open: openCart } = useCartDrawer();

  // Filter nav items based on role
  const navItems = useMemo(() => {
    return navConfig
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        href: item.href,
        label: item.label,
        isActive: item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      }));
  }, [role, pathname]);

  // Mobile nav items with icons
  const mobileNavItems = useMemo(() => {
    return navConfig
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        href: item.href,
        label: item.label,
        icon: item.icon,
      }));
  }, [role]);

  const handleMobileMenuToggle = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen);
  };

  return (
    <>
      <HeaderV7
        navItems={navItems}
        cartCount={itemCount}
        onCartClick={openCart}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={handleMobileMenuToggle}
        showSearch={false}
        rightContent={
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        }
      />
      <MobileNavV7
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={mobileNavItems}
        user={user ? { email: user.email || undefined } : null}
        direction="left"
      />
      <HeaderSpacer />
    </>
  );
}
