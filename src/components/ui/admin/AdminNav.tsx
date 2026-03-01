"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  UtensilsCrossed,
  ClipboardList,
  FolderTree,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  Truck,
  Route,
  LayoutGrid,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Ops Center",
    href: "/admin/ops",
    icon: Activity,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ClipboardList,
  },
  {
    label: "Drivers",
    href: "/admin/drivers",
    icon: Truck,
  },
  {
    label: "Routes",
    href: "/admin/routes",
    icon: Route,
  },
  {
    label: "Menu",
    href: "/admin/menu",
    icon: UtensilsCrossed,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Photos",
    href: "/admin/photos",
    icon: ImageIcon,
  },
  {
    label: "Sections",
    href: "/admin/sections",
    icon: LayoutGrid,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

const indicatorSpring = { type: "spring" as const, stiffness: 300, damping: 30 };
const iconHoverTransition = { duration: 0.3 };

/**
 * V8 Admin Navigation - Teal Accent with Animated Indicator
 *
 * Features:
 * - Animated active indicator that slides between nav items (layoutId)
 * - Icon hover animation (wobble + scale)
 * - Teal accent for active state
 * - Collapsible sidebar with smooth animation
 */
export function AdminNav() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <m.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("flex h-screen flex-col", "bg-surface-secondary border-r border-border")}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-accent-teal">Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5",
                  "font-body text-sm font-medium",
                  "transition-colors duration-fast",
                  isActive
                    ? "text-accent-teal"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
                  isCollapsed && "justify-center px-2"
                )}
              >
                {/* Animated active indicator */}
                {isActive && (
                  <m.div
                    layoutId="admin-nav-indicator"
                    className="absolute inset-0 rounded-lg bg-accent-teal/10"
                    transition={indicatorSpring}
                  />
                )}

                {/* Icon with hover animation */}
                <m.div
                  className="relative z-10 shrink-0"
                  whileHover={{ scale: 1.15, rotate: [-3, 3, 0] }}
                  transition={iconHoverTransition}
                >
                  <Icon
                    className={cn("h-5 w-5", isActive ? "text-accent-teal" : "text-text-muted")}
                  />
                </m.div>

                {!isCollapsed && <span className="relative z-10">{item.label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent className="bg-surface-primary border border-border ml-2">
                    <p className="font-body">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 rounded-input px-3 py-2.5",
                  "font-body text-sm font-medium text-text-muted",
                  "transition-colors duration-fast",
                  "hover:bg-surface-tertiary hover:text-text-primary",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Exit Admin</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent className="bg-surface-primary border border-border ml-2">
                <p className="font-body">Exit Admin</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </m.aside>
    </TooltipProvider>
  );
}
