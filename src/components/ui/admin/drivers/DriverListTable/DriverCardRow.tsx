'use client';

import { Star, Phone, Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CardRow } from '@/components/ui/admin/CardRow';
import { StatusBadge } from '@/components/ui/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { VehicleIcon, VEHICLE_LABELS } from './types';
import type { AdminDriver } from './types';

// ============================================
// TYPES
// ============================================

export interface DriverCardRowProps {
  driver: AdminDriver;
  selected?: boolean;
  onClick?: () => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

// ============================================
// STATUS TINT MAP
// ============================================

const STATUS_TINT: Record<string, string> = {
  active: 'bg-green-50/50',
  inactive: 'bg-gray-50/50',
};

// ============================================
// AVATAR
// ============================================

function DriverAvatar({ name, size = 'md' }: { name: string | null; size?: 'sm' | 'md' }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DR';

  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  return (
    <div
      className={cn(
        'rounded-full bg-accent-teal/10 text-accent-teal flex items-center justify-center font-display font-semibold shrink-0',
        sizeClasses
      )}
    >
      {initials}
    </div>
  );
}

// ============================================
// RATING STARS
// ============================================

function RatingDisplay({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-sm text-text-muted">{'\u2014'}</span>;
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 text-primary fill-primary" />
      <span className="text-sm font-medium text-text-primary tabular-nums">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DriverCardRow({
  driver,
  selected,
  onClick,
  onView,
  onEdit,
}: DriverCardRowProps) {
  const statusTint = STATUS_TINT[driver.isActive ? 'active' : 'inactive'];

  return (
    <CardRow statusTint={statusTint} selected={selected} onClick={onClick} className="gap-4">
      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-4 w-full">
        {/* Avatar + Name + Phone */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <DriverAvatar name={driver.fullName} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {driver.fullName || 'Unnamed Driver'}
            </p>
            {driver.phone && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{driver.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="min-w-[90px]">
          <StatusBadge status={driver.isActive ? 'active' : 'inactive'} />
        </div>

        {/* Deliveries */}
        <div className="min-w-[80px] text-center">
          <span className="text-sm font-semibold text-text-primary tabular-nums">
            {driver.deliveriesCount}
          </span>
          <p className="text-xs text-text-muted">deliveries</p>
        </div>

        {/* Rating */}
        <div className="min-w-[70px] text-center">
          <RatingDisplay rating={driver.ratingAvg} />
        </div>

        {/* Vehicle */}
        <div className="min-w-[100px]">
          {driver.vehicleType ? (
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <div className="text-accent-teal">
                <VehicleIcon type={driver.vehicleType} />
              </div>
              <span className="truncate">{VEHICLE_LABELS[driver.vehicleType]}</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">No vehicle</span>
          )}
        </div>

        {/* Actions - always visible */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-accent-teal hover:text-accent-teal hover:bg-accent-teal/10"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(driver.id);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-text-muted hover:text-accent-teal hover:bg-accent-teal/10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(driver.id);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <DriverAvatar name={driver.fullName} size="sm" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {driver.fullName || 'Unnamed Driver'}
              </p>
              {driver.phone && (
                <p className="text-xs text-text-muted">{driver.phone}</p>
              )}
            </div>
          </div>
          <StatusBadge status={driver.isActive ? 'active' : 'inactive'} />
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="font-medium">{driver.deliveriesCount} deliveries</span>
          <RatingDisplay rating={driver.ratingAvg} />
          {driver.vehicleType && (
            <div className="flex items-center gap-1">
              <VehicleIcon type={driver.vehicleType} />
              <span>{VEHICLE_LABELS[driver.vehicleType]}</span>
            </div>
          )}
        </div>
      </div>
    </CardRow>
  );
}
