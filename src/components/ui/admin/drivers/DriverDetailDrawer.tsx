'use client';

import Link from 'next/link';
import {
  X,
  Phone,
  Mail,
  Pencil,
  Archive,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/admin/StatusBadge';
import { VehicleIcon, VEHICLE_LABELS } from './DriverListTable/types';
import type { AdminDriver } from './DriverListTable/types';

// ============================================
// TYPES
// ============================================

export interface DriverDetailDrawerProps {
  driver: AdminDriver | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
}

// ============================================
// AVATAR (large)
// ============================================

function LargeAvatar({ name }: { name: string | null }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DR';

  return (
    <div className="mx-auto h-20 w-20 rounded-full bg-accent-teal/10 text-accent-teal flex items-center justify-center font-display text-2xl font-bold">
      {initials}
    </div>
  );
}

// ============================================
// STAT ROW
// ============================================

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DriverDetailDrawer({
  driver,
  isOpen,
  onClose,
  onEdit,
}: DriverDetailDrawerProps) {
  if (!driver) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      width="md"
      title={`Driver: ${driver.fullName || 'Unknown'}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-display text-lg font-bold text-text-primary">
            Driver Details
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Avatar + Name + Status */}
          <div className="text-center space-y-3">
            <LargeAvatar name={driver.fullName} />
            <div>
              <h3 className="font-display text-lg font-bold text-text-primary">
                {driver.fullName || 'Unnamed Driver'}
              </h3>
              <div className="mt-1.5 inline-block">
                <StatusBadge
                  status={driver.isActive ? 'active' : 'inactive'}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Contact
            </h4>
            <div className="flex items-center gap-2.5 text-sm text-text-primary">
              <Mail className="h-4 w-4 text-text-muted shrink-0" />
              <span className="truncate">{driver.email}</span>
            </div>
            {driver.phone && (
              <div className="flex items-center gap-2.5 text-sm text-text-primary">
                <Phone className="h-4 w-4 text-text-muted shrink-0" />
                <span>{driver.phone}</span>
              </div>
            )}
          </div>

          {/* Vehicle info */}
          {driver.vehicleType && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Vehicle
              </h4>
              <div className="flex items-center gap-2.5 text-sm text-text-primary">
                <div className="text-accent-teal">
                  <VehicleIcon type={driver.vehicleType} />
                </div>
                <span>{VEHICLE_LABELS[driver.vehicleType]}</span>
                {driver.licensePlate && (
                  <span className="text-text-muted font-mono text-xs ml-1">
                    ({driver.licensePlate})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              Performance
            </h4>
            <div className="rounded-xl bg-surface-secondary p-3">
              <StatRow label="Total Deliveries" value={driver.deliveriesCount} />
              <StatRow
                label="Average Rating"
                value={
                  driver.ratingAvg !== null
                    ? `${driver.ratingAvg.toFixed(1)} / 5.0`
                    : '\u2014'
                }
              />
              <StatRow
                label="Member Since"
                value={new Date(driver.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Quick Actions
            </h4>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => onEdit?.(driver.id)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'justify-start',
                  'text-text-muted hover:text-status-error hover:border-status-error/30'
                )}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Driver
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/admin/drivers/${driver.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Profile
            </Link>
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
