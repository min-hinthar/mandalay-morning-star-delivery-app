# Task: V1-S2-006 — Time Slot Picker

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: None
> **Branch**: `feat/time-slot-picker`

---

## Objective

Create the delivery time slot picker component for Saturday-only delivery. The picker must handle cutoff logic (Friday 15:00 PT), automatically select the correct Saturday (this week or next), and display hourly slots from 11:00 to 19:00. This is a critical piece of the checkout flow.

---

## Acceptance Criteria

- [ ] Shows Saturday delivery date (this week or next)
- [ ] Displays cutoff warning if approaching Friday 15:00 PT
- [ ] Auto-selects next Saturday if past cutoff
- [ ] 8 hourly slots from 11:00 to 19:00
- [ ] Slots displayed as selectable cards/buttons
- [ ] Selected slot visually highlighted
- [ ] Clear time format (12-hour with AM/PM)
- [ ] Mobile-friendly layout
- [ ] All time logic uses America/Los_Angeles timezone
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Time Slot Types

Create `src/types/delivery.ts`:

```typescript
export interface TimeWindow {
  start: string; // "11:00"
  end: string;   // "12:00"
  label: string; // "11:00 AM - 12:00 PM"
}

export interface DeliveryDate {
  date: Date;
  dateString: string; // "2026-01-18"
  displayDate: string; // "Saturday, January 18"
  isNextWeek: boolean;
  cutoffPassed: boolean;
}

export interface DeliverySelection {
  date: string;      // "2026-01-18"
  windowStart: string; // "14:00"
  windowEnd: string;   // "15:00"
}

// Time window options
export const TIME_WINDOWS: TimeWindow[] = [
  { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
  { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
  { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
  { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
  { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
  { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
  { start: '17:00', end: '18:00', label: '5:00 PM - 6:00 PM' },
  { start: '18:00', end: '19:00', label: '6:00 PM - 7:00 PM' },
];

// Cutoff: Friday 15:00 PT
export const CUTOFF_DAY = 5; // Friday (0=Sunday, 5=Friday)
export const CUTOFF_HOUR = 15; // 3:00 PM PT
export const TIMEZONE = 'America/Los_Angeles';
```

### 2. Date Utilities

Create `src/lib/utils/delivery-dates.ts`:

```typescript
import {
  CUTOFF_DAY,
  CUTOFF_HOUR,
  TIMEZONE,
  type DeliveryDate,
} from '@/types/delivery';

/**
 * Get the next Saturday for delivery
 */
export function getNextSaturday(from: Date = new Date()): Date {
  const date = new Date(from);
  const dayOfWeek = date.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get the cutoff time (Friday 15:00 PT) for a given Saturday
 */
export function getCutoffForSaturday(saturday: Date): Date {
  const cutoff = new Date(saturday);
  cutoff.setDate(cutoff.getDate() - 1); // Friday
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);
  return cutoff;
}

/**
 * Check if we're past the cutoff for this Saturday
 */
export function isPastCutoff(saturday: Date, now: Date = new Date()): boolean {
  const cutoff = getCutoffForSaturday(saturday);
  return now > cutoff;
}

/**
 * Get the delivery date info
 */
export function getDeliveryDate(now: Date = new Date()): DeliveryDate {
  const thisSaturday = getNextSaturday(now);
  const pastCutoff = isPastCutoff(thisSaturday, now);

  const deliveryDate = pastCutoff
    ? new Date(thisSaturday.getTime() + 7 * 24 * 60 * 60 * 1000) // Next Saturday
    : thisSaturday;

  return {
    date: deliveryDate,
    dateString: formatDateString(deliveryDate),
    displayDate: formatDisplayDate(deliveryDate),
    isNextWeek: pastCutoff,
    cutoffPassed: pastCutoff,
  };
}

/**
 * Get time remaining until cutoff
 */
export function getTimeUntilCutoff(now: Date = new Date()): {
  hours: number;
  minutes: number;
  isPastCutoff: boolean;
} {
  const thisSaturday = getNextSaturday(now);
  const cutoff = getCutoffForSaturday(thisSaturday);

  const diffMs = cutoff.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isPastCutoff: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isPastCutoff: false };
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display (e.g., "Saturday, January 18")
 */
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE,
  });
}

/**
 * Check if an order can still be edited (before cutoff)
 */
export function canEditOrder(scheduledDate: string): boolean {
  const saturday = new Date(scheduledDate);
  return !isPastCutoff(saturday);
}
```

### 3. Time Slot Picker Component

Create `src/components/checkout/TimeSlotPicker.tsx`:

```typescript
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { TIME_WINDOWS, type TimeWindow } from '@/types/delivery';
import { getDeliveryDate, getTimeUntilCutoff } from '@/lib/utils/delivery-dates';
import { cn } from '@/lib/utils/cn';

interface TimeSlotPickerProps {
  selectedWindow: TimeWindow | null;
  onSelect: (window: TimeWindow) => void;
  className?: string;
}

export function TimeSlotPicker({
  selectedWindow,
  onSelect,
  className,
}: TimeSlotPickerProps) {
  const deliveryDate = useMemo(() => getDeliveryDate(), []);
  const cutoffInfo = useMemo(() => getTimeUntilCutoff(), []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Delivery Date Header */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-brand-red" />
          {deliveryDate.displayDate}
        </div>
        {deliveryDate.isNextWeek && (
          <p className="mt-1 text-sm text-muted-foreground">
            Orders for this Saturday have closed. Your order will be delivered next Saturday.
          </p>
        )}
      </div>

      {/* Cutoff Warning */}
      {!cutoffInfo.isPastCutoff && cutoffInfo.hours < 24 && (
        <CutoffWarning hours={cutoffInfo.hours} minutes={cutoffInfo.minutes} />
      )}

      {/* Time Slots */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          Select a delivery window
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIME_WINDOWS.map((window) => (
            <TimeSlotButton
              key={window.start}
              window={window}
              isSelected={selectedWindow?.start === window.start}
              onSelect={() => onSelect(window)}
            />
          ))}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedWindow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30"
        >
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Delivery: {deliveryDate.displayDate}, {selectedWindow.label}
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface TimeSlotButtonProps {
  window: TimeWindow;
  isSelected: boolean;
  onSelect: () => void;
}

function TimeSlotButton({ window, isSelected, onSelect }: TimeSlotButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative rounded-lg border-2 p-3 text-center transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2',
        isSelected
          ? 'border-brand-red bg-brand-red/10 text-brand-red'
          : 'border-border hover:border-brand-red/50 hover:bg-muted/50'
      )}
    >
      <span className="text-sm font-medium">{formatShortTime(window.start)}</span>
      <span className="mx-1 text-muted-foreground">-</span>
      <span className="text-sm font-medium">{formatShortTime(window.end)}</span>

      {isSelected && (
        <motion.div
          layoutId="selectedSlot"
          className="absolute inset-0 rounded-lg border-2 border-brand-red"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

function CutoffWarning({ hours, minutes }: { hours: number; minutes: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30"
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <div>
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Order soon for this Saturday!
        </p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          Orders close in {hours}h {minutes}m (Friday 3:00 PM)
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Format 24h time to 12h display (e.g., "14:00" -> "2 PM")
 */
function formatShortTime(time: string): string {
  const [hours] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour} ${period}`;
}
```

### 4. Time Slot State Hook

Create `src/lib/hooks/useTimeSlot.ts`:

```typescript
import { useState, useMemo } from 'react';
import { TIME_WINDOWS, type TimeWindow, type DeliverySelection } from '@/types/delivery';
import { getDeliveryDate } from '@/lib/utils/delivery-dates';

export function useTimeSlot() {
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow | null>(null);

  const deliveryDate = useMemo(() => getDeliveryDate(), []);

  const selection: DeliverySelection | null = selectedWindow
    ? {
        date: deliveryDate.dateString,
        windowStart: selectedWindow.start,
        windowEnd: selectedWindow.end,
      }
    : null;

  return {
    selectedWindow,
    setSelectedWindow,
    selection,
    deliveryDate,
    isValid: selectedWindow !== null,
  };
}
```

### 5. Compact Time Display

Create `src/components/checkout/TimeSlotDisplay.tsx`:

```typescript
'use client';

import { Calendar, Clock } from 'lucide-react';
import type { DeliverySelection } from '@/types/delivery';
import { TIME_WINDOWS } from '@/types/delivery';
import { cn } from '@/lib/utils/cn';

interface TimeSlotDisplayProps {
  selection: DeliverySelection;
  className?: string;
}

export function TimeSlotDisplay({ selection, className }: TimeSlotDisplayProps) {
  const window = TIME_WINDOWS.find((w) => w.start === selection.windowStart);

  const displayDate = new Date(selection.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <span className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {displayDate}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-muted-foreground" />
        {window?.label || `${selection.windowStart} - ${selection.windowEnd}`}
      </span>
    </div>
  );
}
```

---

## Test Plan

### Unit Tests

Create `src/lib/utils/__tests__/delivery-dates.test.ts`:

```typescript
import {
  getNextSaturday,
  getCutoffForSaturday,
  isPastCutoff,
  getDeliveryDate,
  getTimeUntilCutoff,
} from '../delivery-dates';

describe('Delivery Date Utils', () => {
  describe('getNextSaturday', () => {
    it('returns this Saturday when called on Monday', () => {
      const monday = new Date('2026-01-12T10:00:00'); // Monday
      const saturday = getNextSaturday(monday);
      expect(saturday.getDay()).toBe(6); // Saturday
      expect(saturday.getDate()).toBe(17);
    });

    it('returns next Saturday when called on Saturday', () => {
      const saturday = new Date('2026-01-17T10:00:00');
      const nextSaturday = getNextSaturday(saturday);
      expect(nextSaturday.getDate()).toBe(24);
    });
  });

  describe('isPastCutoff', () => {
    it('returns false before Friday 3pm', () => {
      const saturday = new Date('2026-01-18T00:00:00');
      const fridayMorning = new Date('2026-01-17T10:00:00');
      expect(isPastCutoff(saturday, fridayMorning)).toBe(false);
    });

    it('returns true after Friday 3pm', () => {
      const saturday = new Date('2026-01-18T00:00:00');
      const fridayEvening = new Date('2026-01-17T16:00:00');
      expect(isPastCutoff(saturday, fridayEvening)).toBe(true);
    });
  });

  describe('getDeliveryDate', () => {
    it('returns this Saturday before cutoff', () => {
      const wednesday = new Date('2026-01-14T10:00:00');
      const result = getDeliveryDate(wednesday);
      expect(result.isNextWeek).toBe(false);
      expect(result.dateString).toBe('2026-01-17');
    });

    it('returns next Saturday after cutoff', () => {
      const fridayEvening = new Date('2026-01-16T18:00:00');
      const result = getDeliveryDate(fridayEvening);
      expect(result.isNextWeek).toBe(true);
    });
  });
});
```

### Visual Testing

1. **Date Display**
   - [ ] Shows correct Saturday date
   - [ ] Shows "next Saturday" message after cutoff
   - [ ] Date format is readable

2. **Cutoff Warning**
   - [ ] Appears when < 24 hours to cutoff
   - [ ] Shows correct countdown
   - [ ] Hidden after cutoff passes

3. **Slot Selection**
   - [ ] All 8 slots displayed
   - [ ] Selected slot highlighted
   - [ ] Animation on selection
   - [ ] Keyboard accessible

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Delivery types defined
2. [ ] Date utility functions implemented
3. [ ] `getDeliveryDate` handles cutoff logic
4. [ ] `getTimeUntilCutoff` calculates countdown
5. [ ] TimeSlotPicker component created
6. [ ] 8 hourly slots displayed (11:00-19:00)
7. [ ] Cutoff warning shows when < 24h
8. [ ] Selected slot visually highlighted
9. [ ] Compact display component created
10. [ ] `useTimeSlot` hook created
11. [ ] Unit tests pass
12. [ ] All times use America/Los_Angeles
13. [ ] `pnpm lint` passes
14. [ ] `pnpm typecheck` passes
15. [ ] `pnpm build` succeeds
16. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- **CRITICAL**: All cutoff logic must use America/Los_Angeles timezone
- Cutoff: Friday 15:00 PT for Saturday delivery
- After cutoff, orders target NEXT Saturday automatically
- No slot availability logic in V1 (all slots always available)
- Time format: 12-hour with AM/PM for user display
- 24-hour format for internal storage (e.g., "14:00")
- 8 one-hour windows from 11:00-19:00
- Consider using date-fns-tz for production timezone handling

---

*Task ready for implementation*
