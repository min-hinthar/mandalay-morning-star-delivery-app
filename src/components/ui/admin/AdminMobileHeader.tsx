"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { AdminNav } from "@/components/ui/admin/AdminNav";

interface AdminMobileHeaderProps {
  /** Optional right-side action element (e.g., "Add" button on menu page) */
  actionSlot?: ReactNode;
}

/** Map pathname segments to page titles (UI-SPEC copywriting contract) */
export function getPageTitle(pathname: string): string {
  // Check dynamic/prefix routes first (order matters: more specific before less specific)
  if (pathname === "/admin/routes/builder") return "Route Builder";
  if (pathname === "/admin/analytics/delivery") return "Delivery Analytics";
  if (pathname === "/admin/analytics/drivers") return "Driver Analytics";
  if (pathname.startsWith("/admin/orders/")) return "Order Details";
  if (pathname.startsWith("/admin/routes/")) return "Route Details";
  if (pathname.startsWith("/admin/menu/")) return "Edit Item";

  // Exact matches
  const titles: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/ops": "Ops Center",
    "/admin/orders": "Orders",
    "/admin/drivers": "Drivers",
    "/admin/routes": "Routes",
    "/admin/menu": "Menu",
    "/admin/categories": "Categories",
    "/admin/photos": "Photos",
    "/admin/sections": "Sections",
    "/admin/analytics": "Analytics",
    "/admin/feedback": "Feedback",
    "/admin/ratings": "Ratings",
    "/admin/emails": "Emails",
    "/admin/settings": "Settings",
  };

  return titles[pathname] ?? "Admin";
}

export function AdminMobileHeader({ actionSlot }: AdminMobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <>
      <header
        className="fixed inset-x-0 z-30 flex h-14 items-center border-b border-border bg-neutral-50 px-4 md:hidden"
        style={{ top: "calc(env(safe-area-inset-top, 0px))" }}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="flex-1 text-center font-display text-lg font-bold truncate">{pageTitle}</h1>

        {/* Right action slot -- renders provided element or 44px spacer for title centering */}
        {actionSlot ?? <div className="w-11" aria-hidden="true" />}
      </header>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="left"
        width="sm"
        title="Admin navigation"
      >
        <AdminNav variant="drawer" />
      </Drawer>
    </>
  );
}
