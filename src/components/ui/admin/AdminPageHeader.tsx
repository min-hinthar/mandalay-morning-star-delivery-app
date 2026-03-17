"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";

// ============================================
// TYPES
// ============================================

interface Breadcrumb {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  count?: number;
  countFormat?: "number" | "currency";
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function AdminPageHeader({
  title,
  count,
  countFormat = "number",
  actions,
  breadcrumbs,
  className,
}: AdminPageHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div className={cn("mb-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <m.div
                key={crumb.label}
                initial={shouldAnimate ? { opacity: 0, x: -8 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                transition={
                  shouldAnimate ? { ...getSpring(spring.default), delay: i * 0.05 } : undefined
                }
                className="flex items-center gap-1"
              >
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-muted" />}
                {isLast || !crumb.href ? (
                  <span className="font-medium text-text-primary">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-text-muted transition-colors hover:text-text-primary"
                  >
                    {crumb.label}
                  </Link>
                )}
              </m.div>
            );
          })}
        </nav>
      )}

      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>

          {/* Animated count badge */}
          {count !== undefined && (
            <m.div
              initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
              animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
              transition={getSpring(spring.default)}
              className="rounded-full bg-accent-teal/10 px-3 py-1 text-sm font-semibold text-accent-teal"
            >
              <AnimatedValue value={count} format={countFormat} />
            </m.div>
          )}
        </div>

        {/* Actions slot */}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
