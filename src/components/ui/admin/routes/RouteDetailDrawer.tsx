'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { m, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  X,
  MapPin,
  User,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  Zap,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { spring } from '@/lib/motion-tokens';
import { useAnimationPreference } from '@/lib/hooks/useAnimationPreference';
import { StatusBadge } from '@/components/ui/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import type { AdminRoute } from './RouteListTable/types';

// ============================================
// TYPES
// ============================================

export interface RouteDetailDrawerProps {
  route: AdminRoute | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (routeId: string) => void;
}

// ============================================
// STOP STATUS ICON
// ============================================

function StopStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return <CheckCircle2 className="h-4 w-4 text-status-success" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-status-warning" />;
    default:
      return <Circle className="h-4 w-4 text-text-muted" />;
  }
}

// ============================================
// COMPONENT
// ============================================

export function RouteDetailDrawer({
  route,
  open,
  onClose,
  onDelete,
}: RouteDetailDrawerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Close on escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Generate mock stops from route data
  const stops = route
    ? Array.from({ length: Math.min(route.stopCount, 8) }, (_, i) => ({
        name: `Stop ${i + 1}`,
        status: i < route.deliveredCount ? 'delivered' : 'pending',
      }))
    : [];

  const estMinutes = route ? route.stopCount * 15 : 0;

  return (
    <AnimatePresence>
      {open && route && (
        <>
          {/* Backdrop */}
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-surface-inverse/40"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <m.aside
            key="drawer"
            initial={shouldAnimate ? { x: '100%' } : undefined}
            animate={shouldAnimate ? { x: 0 } : undefined}
            exit={shouldAnimate ? { x: '100%' } : undefined}
            transition={getSpring(spring.default)}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface-primary border-l border-border shadow-xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-primary/95 backdrop-blur-sm px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-text-primary">
                  Route Details
                </h2>
                <p className="text-xs text-text-muted font-mono">
                  #{route.id.slice(0, 8)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent-teal" />
                  <span className="text-sm font-medium text-text-primary">
                    {format(parseISO(route.deliveryDate), 'EEEE, MMM d, yyyy')}
                  </span>
                </div>
                <StatusBadge status={route.status} size="md" />
              </div>

              {/* Driver assignment */}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Driver
                </p>
                {route.driver ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent-teal/10 flex items-center justify-center text-accent-teal font-semibold">
                      {route.driver.fullName
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'DR'}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {route.driver.fullName || 'Unnamed'}
                    </span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-text-muted italic">
                    <User className="h-4 w-4" />
                    Unassigned
                  </span>
                )}
              </div>

              {/* Progress summary */}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Delivery Progress
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-accent-teal">
                      {route.deliveredCount}
                    </p>
                    <p className="text-xs text-text-muted">Delivered</p>
                  </div>
                  <div className="text-text-muted">/</div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-text-primary">
                      {route.stopCount}
                    </p>
                    <p className="text-xs text-text-muted">Total Stops</p>
                  </div>
                  <div className="ml-auto">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-accent-teal">
                        {route.completionRate}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                  <m.div
                    className="h-full rounded-full bg-accent-teal"
                    initial={
                      shouldAnimate
                        ? { width: 0 }
                        : { width: `${route.completionRate}%` }
                    }
                    animate={{ width: `${route.completionRate}%` }}
                    transition={getSpring(spring.gentle)}
                  />
                </div>
              </div>

              {/* Mini stop list */}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Stops
                </p>
                <div className="space-y-2">
                  {stops.map((stop, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                        stop.status === 'delivered'
                          ? 'bg-green-50/50'
                          : 'bg-surface-secondary'
                      )}
                    >
                      <StopStatusIcon status={stop.status} />
                      <span className="text-text-primary">{stop.name}</span>
                      <span className="ml-auto text-xs text-text-muted capitalize">
                        {stop.status}
                      </span>
                    </div>
                  ))}
                  {route.stopCount > 8 && (
                    <p className="text-xs text-text-muted text-center py-1">
                      +{route.stopCount - 8} more stops
                    </p>
                  )}
                </div>
              </div>

              {/* Time estimate */}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Time Estimate
                </p>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-primary">
                    ~{estMinutes} min estimated
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-center border-accent-teal/30 text-accent-teal hover:bg-accent-teal/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Route
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {route.status === 'planned' && onDelete && (
                    <Button
                      variant="outline"
                      className="flex-1 justify-center border-red-200 text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(route.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* View Full Details link */}
              <Button
                asChild
                variant="primary"
                className="w-full justify-center"
              >
                <Link href={`/admin/routes/${route.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Details
                </Link>
              </Button>
            </div>
          </m.aside>
        </>
      )}
    </AnimatePresence>
  );
}
