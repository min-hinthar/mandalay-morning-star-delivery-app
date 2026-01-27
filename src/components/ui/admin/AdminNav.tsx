"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
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

/**
 * V6 Admin Navigation - Pepper Aesthetic
 *
 * Features:
 * - V6 colors with primary red accent
 * - Collapsible sidebar with smooth animation
 * - Active state with left border accent
 * - V6 typography and hover states
 */
export function AdminNav() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "flex h-screen flex-col",
          "bg-surface-secondary border-r border-border"
        )}
      >
        {/* V6 Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-primary">
                Admin
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* V6 Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-input px-3 py-2.5",
                  "font-body text-sm font-medium",
                  "transition-all duration-fast",
                  isActive
                    ? [
                        "bg-primary/10 text-primary",
                        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                        "before:h-6 before:w-1 before:rounded-r-full before:bg-primary",
                      ]
                    : [
                        "text-text-secondary",
                        "hover:bg-surface-tertiary hover:text-text-primary",
                      ],
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-primary" : "text-text-muted"
                )} />
                {!isCollapsed && <span>{item.label}</span>}
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

        {/* V6 Footer */}
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
      </motion.aside>
    </TooltipProvider>
  );
}
