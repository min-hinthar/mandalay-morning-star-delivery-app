# Phase 100: Admin Route Editing - Research

**Researched:** 2026-03-15
**Domain:** Drag-and-drop reorder, route split/merge operations, Supabase atomic RPCs
**Confidence:** HIGH

## Summary

Phase 100 adds route editing capabilities (drag-reorder, split, merge, driver reassign) to the admin route detail view. The existing codebase already has substantial infrastructure: `batch_update_stop_indices` RPC with DEFERRABLE constraint, `reindex_route_stops` RPC, `update_route_stats` RPC, `prevent_duplicate_active_assignment` trigger, `reorderStopsSchema` Zod validation, and the full route detail API with stop management.

The primary new dependency is `@dnd-kit/core` + `@dnd-kit/sortable` (~15KB gzipped). Both packages declare `react >= 16.8.0` as peer dependency, so React 19.2.3 is fully compatible. No version conflicts. The new Supabase RPCs (`split_route`, `merge_routes`) must be atomic SECURITY DEFINER functions that handle the `prevent_duplicate_active_assignment` trigger by deleting source stops before inserting into destination route within one transaction.

**Primary recommendation:** Install @dnd-kit/core@6.3.1 + @dnd-kit/sortable@10.0.0. Build DragReorderList as a generic component. Use PointerSensor (handles both mouse and touch) + KeyboardSensor. Write split_route/merge_routes as single atomic RPCs that manage trigger safety internally.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Desktop: drag handle (6-dot grip icon) on left side of RouteStopCard, always visible -- only handle initiates drag
- Ghost card overlay while dragging (semi-transparent clone follows cursor, dashed placeholder at original position)
- Smooth spring transition animation (~200ms, @dnd-kit built-in CSS transitions)
- Keyboard accessibility: Space/Enter to pick up, arrow keys to move, Space/Enter to drop, Escape to cancel
- Same-route drag only -- cross-route moves use existing Reassign dropdown
- Immediate save on each drag-drop (optimistic UI, API call in background, silent success, error toast + revert)
- Mobile: up/down chevron buttons stacked vertically, 44px touch targets, responsive switch at md: breakpoint
- Split Route: checkbox multi-select from Actions dropdown, confirmation modal with driver picker, atomic split_route RPC
- Merge Route: modal with radio route picker, same-date planned routes only, atomic merge_routes RPC
- RouteStopCard extracted into subfolder before adding features
- DragReorderList: generic reusable component in src/components/ui/DragReorderList/
- Actions dropdown (three-dot) with Radix DropdownMenu, Lucide icons (Scissors, GitMerge, Trash2)
- API endpoints: POST /api/admin/routes/[id]/split and POST /api/admin/routes/[id]/merge
- Single migration: 20260315_route_editing_rpcs.sql
- Split/merge: invalidate + refetch. Reorder: optimistic + revert on error.
- Vitest unit tests only -- no E2E for drag-and-drop

### Claude's Discretion
- Exact @dnd-kit sensor configuration (activation distance, keyboard coordinate getter)
- DragOverlay styling details (opacity, shadow, scale)
- Selection mode transition animation (if any)
- Exact Zod schema constraints (UUID format validation, max stops per route)
- Toast message wording and duration
- Split/merge modal spacing and typography

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-01 | Admin can drag-reorder stops on desktop (DnD via @dnd-kit) | @dnd-kit/core@6.3.1 + @dnd-kit/sortable@10.0.0, PointerSensor + KeyboardSensor, DragOverlay for ghost card, existing batch_update_stop_indices RPC |
| ROUTE-02 | Admin can reorder stops on mobile via move-up/move-down buttons | MoveButtons subcomponent in DragReorderList, responsive switch at md: breakpoint, same reorder API as drag |
| ROUTE-03 | Admin can split overloaded route into two (select stops, new route) | split_route atomic RPC, checkbox selection mode on RouteStopCard, POST /api/admin/routes/[id]/split |
| ROUTE-04 | Admin can merge two light routes into one | merge_routes atomic RPC, route picker modal, POST /api/admin/routes/[id]/merge |
| ROUTE-05 | Admin can reassign driver on in-progress route | Existing PATCH endpoint + confirmation dialog for in_progress routes |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | DnD context, sensors, collision detection, DragOverlay | De facto standard for React DnD since react-beautiful-dnd deprecated |
| @dnd-kit/sortable | 10.0.0 | Sortable preset (useSortable, SortableContext, arrayMove) | Official preset for reorderable lists |
| @dnd-kit/utilities | 3.2.2 | CSS utility (CSS.Transform.toString) | Required for transform styles |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dropdown-menu | installed | Actions dropdown (three-dot menu) | Route header actions |
| lucide-react | 0.562.0 | Icons (GripVertical, ChevronUp, ChevronDown, Scissors, GitMerge, Trash2, MoreVertical) | All UI icons |
| zod | installed | Schema validation for split/merge API bodies | API request validation |
| framer-motion | installed | Entry animations on cards (existing m.div pattern) | Keep existing animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core+sortable | @dnd-kit/react (v0.3.2) | New API, still beta (0.x), different import structure -- stick with stable core+sortable |
| PointerSensor | MouseSensor+TouchSensor separately | PointerSensor handles both; use separate sensors only if different activation constraints needed per device |

**Installation:**
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/ui/DragReorderList/
  index.tsx           # Barrel: exports DragReorderList, DragHandle, MoveButtons, SortableItem
  DragReorderList.tsx  # Main component: DndContext + SortableContext + DragOverlay
  SortableItem.tsx     # useSortable wrapper, renders children with drag ref
  DragHandle.tsx       # 6-dot grip icon, receives listeners from useSortable
  MoveButtons.tsx      # Up/down chevrons for mobile, calls onMoveUp/onMoveDown

src/components/ui/admin/routes/RouteStopCard/
  index.tsx            # Barrel: exports RouteStopCard (default + named)
  StopCardContent.tsx  # Display-only: customer info, order summary, timestamps, exception
  StopCardActions.tsx  # Status dropdown, reassign, remove button
  RouteStopCard.tsx    # Orchestrator: renders content + actions, accepts selectionMode prop

src/components/ui/admin/routes/RouteDetailClient/
  RouteDetailClient.tsx  # Main view (existing, extended with reorder/split/merge state)
  RouteHeader.tsx         # Extended: add Actions dropdown (three-dot)
  RouteActionsMenu.tsx    # NEW: three-dot dropdown with Split/Merge/Delete items
  DriverInfoCard.tsx      # Existing, add confirmation dialog for in_progress reassign
  SplitRouteModal.tsx     # NEW: checkbox selection + driver picker + confirm
  MergeRouteModal.tsx     # NEW: route picker radio buttons + confirm

src/lib/hooks/
  useReorderStops.ts     # Mutation hook: optimistic reorder + batch_update_stop_indices
  useSplitRoute.ts       # Mutation hook: POST /api/admin/routes/[id]/split + invalidate
  useMergeRoutes.ts      # Mutation hook: POST /api/admin/routes/[id]/merge + invalidate
  useReassignDriver.ts   # Mutation hook: PATCH driver + confirmation for in_progress

src/app/api/admin/routes/[id]/
  split/route.ts         # POST handler: validate, call split_route RPC
  merge/route.ts         # POST handler: validate, call merge_routes RPC
```

### Pattern 1: Generic DragReorderList Component
**What:** A reusable sortable list with built-in DragOverlay, responsive drag handles/move buttons
**When to use:** Any vertical list that needs drag reorder (Phase 100 routes, Phase 101 driver stops)

```typescript
// Source: @dnd-kit official docs + project conventions
interface DragReorderListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  getItemId: (item: T) => string;
  disabled?: boolean;
}
```

Key implementation details:
- `DndContext` with `closestCenter` collision detection
- `SortableContext` with `verticalListSortingStrategy`
- Sensors: `PointerSensor` with `activationConstraint: { distance: 8 }` (prevents accidental drags)
- `KeyboardSensor` with `sortableKeyboardCoordinates`
- `DragOverlay` renders a presentational clone (NOT a useSortable component -- avoids ID collision)
- `arrayMove` from @dnd-kit/sortable for reordering
- DragHandle visible only on md+ screens; MoveButtons visible only below md

### Pattern 2: Optimistic Reorder with Revert
**What:** Update local state immediately on drag-end, fire API call, revert on error
**When to use:** Reorder operations where instant feedback matters

```typescript
// In RouteDetailClient or dedicated hook
const handleReorder = (reorderedStops: StopDetail[]) => {
  const previousStops = [...stops]; // snapshot for revert
  setStops(reorderedStops); // optimistic update
  setIsManuallyReordered(true);

  const stopOrder = reorderedStops.map((s, i) => ({
    stopId: s.id,
    stopIndex: i,
  }));

  fetch(`/api/admin/routes/${routeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stopOrder }),
  }).then(res => {
    if (!res.ok) throw new Error('Reorder failed');
  }).catch(() => {
    setStops(previousStops); // revert
    toast({ message: 'Failed to reorder stops', type: 'error' });
  });
};
```

### Pattern 3: Atomic Split/Merge RPCs
**What:** Single PostgreSQL function that handles all state changes in one transaction
**When to use:** Operations that touch multiple tables and must respect triggers

```sql
-- split_route: must DELETE from source before INSERT to avoid
-- prevent_duplicate_active_assignment trigger violation
CREATE OR REPLACE FUNCTION split_route(
  p_source_route_id uuid,
  p_stop_ids uuid[],
  p_new_driver_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_new_route_id uuid;
  v_delivery_date date;
BEGIN
  -- Get source route delivery date
  SELECT delivery_date INTO v_delivery_date FROM routes WHERE id = p_source_route_id;

  -- Create new route
  INSERT INTO routes (delivery_date, driver_id, status)
  VALUES (v_delivery_date, p_new_driver_id, 'planned')
  RETURNING id INTO v_new_route_id;

  -- Move stops: UPDATE route_id (not DELETE+INSERT) to avoid trigger
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  UPDATE route_stops
  SET route_id = v_new_route_id, stop_index = sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE id = ANY(p_stop_ids)
  ) sub
  WHERE route_stops.id = sub.id;

  -- Reindex source route
  PERFORM reindex_route_stops(p_source_route_id);

  -- Update stats for both routes
  PERFORM update_route_stats(p_source_route_id);
  PERFORM update_route_stats(v_new_route_id);

  RETURN v_new_route_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Critical insight on trigger safety:** The `prevent_duplicate_active_assignment` trigger fires on INSERT only. Using UPDATE to change `route_id` instead of DELETE+INSERT avoids the trigger entirely. This is the safest approach.

### Pattern 4: Selection Mode for Split
**What:** Toggle selection mode on stop cards for multi-select operations
**When to use:** Split route flow

```typescript
// State in RouteDetailClient
const [selectionMode, setSelectionMode] = useState(false);
const [selectedStopIds, setSelectedStopIds] = useState<Set<string>>(new Set());

// Pass to StopsList -> RouteStopCard
<RouteStopCard
  selectionMode={selectionMode}
  selected={selectedStopIds.has(stop.id)}
  onToggleSelect={(id) => toggleStopSelection(id)}
  disabled={stop.status !== 'pending'} // lock delivered/skipped
/>
```

### Anti-Patterns to Avoid
- **Rendering useSortable inside DragOverlay:** Causes duplicate IDs. Use presentational component for overlay.
- **DELETE+INSERT for split/merge:** Triggers `prevent_duplicate_active_assignment`. Use UPDATE route_id instead.
- **Adding overflow-y-auto without explicit height on drag container:** DragOverlay position breaks with nested scrolling.
- **Manual useMemo for sensors/config:** React Compiler handles memoization. Use `useSensors`/`useSensor` directly.
- **useRef on conditionally rendered drag containers:** Observer breaks. Use stable wrapper element that's always mounted.
- **Debouncing reorder calls:** User decided fire immediately -- latest wins. Do NOT debounce.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop | Custom pointer tracking + DOM manipulation | @dnd-kit/core + @dnd-kit/sortable | Accessibility, keyboard support, touch support, scroll handling, collision detection |
| Array reordering | Manual splice/index math | `arrayMove` from @dnd-kit/sortable | Edge cases with same-position moves, immutable update |
| Keyboard coordinate getter | Custom arrow key handler | `sortableKeyboardCoordinates` from @dnd-kit/sortable | Handles focus management, direction detection |
| Drag overlay positioning | Manual portal + absolute positioning | `DragOverlay` from @dnd-kit/core | Viewport-relative, handles scroll offset, z-index |
| CSS transform strings | Template literal math | `CSS.Transform.toString()` from @dnd-kit/utilities | Handles null transforms, scale, translate |
| Atomic multi-table updates | Sequential Supabase calls | PostgreSQL RPC function | Transaction guarantees, trigger safety, constraint deferral |
| Stop reindexing | Loop of individual UPDATEs | Existing `reindex_route_stops` RPC | Single CTE, atomic, no partial failure states |

## Common Pitfalls

### Pitfall 1: DragOverlay ID Collision
**What goes wrong:** Rendering a component that uses `useSortable` inside `DragOverlay` creates two DOM nodes with the same draggable ID.
**Why it happens:** `useSortable` registers the element with DndContext. Two registrations = conflict.
**How to avoid:** Create a presentational `StopCardContent` component. Render it in `SortableItem` AND in `DragOverlay`. Only `SortableItem` uses `useSortable`.
**Warning signs:** Console warnings about duplicate IDs, drag overlay jumps or doesn't follow cursor.

### Pitfall 2: prevent_duplicate_active_assignment Trigger on Split
**What goes wrong:** Split route creates new route_stops rows, trigger checks if order already exists in another active route, finds the source route stop (not yet deleted), throws exception.
**Why it happens:** Trigger fires per-row on INSERT. Within a transaction, the old row still exists when the new row is being inserted.
**How to avoid:** Use UPDATE (change route_id) instead of DELETE+INSERT. Or DELETE first, then INSERT in the same RPC. UPDATE is cleaner.
**Warning signs:** "Order X is already assigned to an active route" error on split.

### Pitfall 3: Nested Scroll + DragOverlay Positioning
**What goes wrong:** DragOverlay appears at wrong position or cards are undraggable when the stops list is inside a scrollable container.
**Why it happens:** DragOverlay calculates position relative to viewport, but scroll offset isn't accounted for if parent has `overflow-y-auto` without explicit height.
**How to avoid:** Ensure the DragReorderList's parent has explicit height (e.g., flex-1) OR use the auto-scroll feature built into @dnd-kit. Don't nest multiple scrollable containers.
**Warning signs:** Overlay offset from cursor, drag stops working when scrolled down.

### Pitfall 4: touchAction CSS Conflicts
**What goes wrong:** Drag handles don't work on mobile because browser interprets touch as scroll.
**Why it happens:** Default `touch-action: auto` on the drag handle element lets the browser handle the touch event for scrolling.
**How to avoid:** Add `touch-action: none` to the drag handle element only. The rest of the card keeps `touch-action: pan-y` so content remains scrollable.
**Warning signs:** Drag doesn't initiate on touch devices, 300ms delay before drag starts.

### Pitfall 5: Stale Closure in Optimistic Revert
**What goes wrong:** Error handler reverts to stale stop order because the closure captured old state.
**Why it happens:** The `previousStops` snapshot was captured before the current render cycle.
**How to avoid:** Capture the snapshot in a ref or use functional state updates. Since React Compiler is active, be extra careful that the revert value is from the correct render.
**Warning signs:** Reverting to wrong order after failed reorder, or not reverting at all.

### Pitfall 6: Existing Reorder API Rejects In-Progress Routes
**What goes wrong:** PATCH /api/admin/routes/[id] with stopOrder returns 409 for in_progress routes.
**Why it happens:** Existing code checks `routeCheck?.status === "in_progress"` and rejects unless `forceOverride: true`.
**How to avoid:** Send `forceOverride: true` in the request body when reordering pending stops on in_progress routes. The CONTEXT.md explicitly allows reordering pending stops on in_progress routes.
**Warning signs:** 409 error when dragging stops on an in_progress route.

### Pitfall 7: RouteStopCard 400-Line ESLint Limit
**What goes wrong:** Adding drag handle + selection mode + move buttons to the existing 317-line RouteStopCard exceeds 400-line limit.
**Why it happens:** File is already 317 lines with display, actions, and confirmation dialog.
**How to avoid:** Extract into subfolder FIRST (StopCardContent.tsx + StopCardActions.tsx) before adding any new features. This is explicitly required in CONTEXT.md implementation order.
**Warning signs:** ESLint max-lines warning, PR review failure.

## Code Examples

### DragReorderList Core Implementation
```typescript
// Source: @dnd-kit official docs, adapted for project patterns
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

interface DragReorderListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  renderOverlay: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
  disabled?: boolean;
}

export function DragReorderList<T>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  getItemId,
  disabled = false,
}: DragReorderListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = activeId ? items.find((item) => getItemId(item) === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
      const newIndex = items.findIndex((item) => getItemId(item) === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  if (disabled) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={getItemId(item)}>{renderItem(item, false)}</div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(getItemId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {items.map((item) => (
            <SortableItem key={getItemId(item)} id={getItemId(item)}>
              {renderItem(item, getItemId(item) === activeId)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeItem ? renderOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### SortableItem with DragHandle
```typescript
// Source: @dnd-kit/sortable docs
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1, // ghost effect: original fades
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* DragHandle receives listeners -- only handle initiates drag */}
      {children}
    </div>
  );
}
```

### DragHandle Component
```typescript
// Source: project convention + @dnd-kit pattern
'use client';

import { GripVertical } from 'lucide-react';
import type { SyntheticListenerMap } from '@dnd-kit/core';

interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: Record<string, unknown>;
}

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <button
      type="button"
      className="hidden md:flex items-center justify-center w-8 h-8 rounded cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary touch-none"
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
}
```

### MoveButtons Component
```typescript
'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MoveButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function MoveButtons({ onMoveUp, onMoveDown, isFirst, isLast }: MoveButtonsProps) {
  return (
    <div className="flex md:hidden flex-col gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Move up"
        className="h-11 w-11" // 44px touch target
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Move down"
        className="h-11 w-11" // 44px touch target
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### Split Route RPC (PostgreSQL)
```sql
-- Source: Project patterns from existing RPCs + trigger analysis
CREATE OR REPLACE FUNCTION split_route(
  p_source_route_id uuid,
  p_stop_ids uuid[],
  p_new_driver_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_new_route_id uuid;
  v_delivery_date date;
  v_remaining_count int;
BEGIN
  -- Validate source route exists
  SELECT delivery_date INTO STRICT v_delivery_date
  FROM routes WHERE id = p_source_route_id;

  -- Validate stops belong to source route
  IF NOT (
    SELECT count(*) = array_length(p_stop_ids, 1)
    FROM route_stops
    WHERE id = ANY(p_stop_ids) AND route_id = p_source_route_id
  ) THEN
    RAISE EXCEPTION 'Some stop IDs do not belong to source route';
  END IF;

  -- Validate at least 1 stop remains in source
  SELECT count(*) INTO v_remaining_count
  FROM route_stops
  WHERE route_id = p_source_route_id AND id != ALL(p_stop_ids);

  IF v_remaining_count < 1 THEN
    RAISE EXCEPTION 'At least one stop must remain in the source route';
  END IF;

  -- Create new route (always planned)
  INSERT INTO routes (delivery_date, driver_id, status)
  VALUES (v_delivery_date, p_new_driver_id, 'planned')
  RETURNING id INTO v_new_route_id;

  -- Defer unique constraint for reindexing
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move stops via UPDATE (avoids prevent_duplicate_active_assignment trigger on INSERT)
  UPDATE route_stops
  SET route_id = v_new_route_id, stop_index = sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE id = ANY(p_stop_ids)
  ) sub
  WHERE route_stops.id = sub.id;

  -- Reindex source route remaining stops
  PERFORM reindex_route_stops(p_source_route_id);

  -- Update stats for both routes
  PERFORM update_route_stats(p_source_route_id);
  PERFORM update_route_stats(v_new_route_id);

  RETURN v_new_route_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Merge Routes RPC (PostgreSQL)
```sql
CREATE OR REPLACE FUNCTION merge_routes(
  p_destination_route_id uuid,
  p_source_route_id uuid
)
RETURNS int AS $$
DECLARE
  v_max_index int;
  v_total_stops int;
  v_source_status text;
BEGIN
  -- Validate source is planned (can only absorb planned routes)
  SELECT status INTO STRICT v_source_status
  FROM routes WHERE id = p_source_route_id;

  IF v_source_status != 'planned' THEN
    RAISE EXCEPTION 'Can only merge planned routes (source is %)', v_source_status;
  END IF;

  -- Get max stop_index in destination
  SELECT COALESCE(MAX(stop_index), -1) INTO v_max_index
  FROM route_stops WHERE route_id = p_destination_route_id;

  -- Defer unique constraint
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move all stops from source to destination, appending after last stop
  UPDATE route_stops
  SET route_id = p_destination_route_id,
      stop_index = v_max_index + 1 + sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE route_id = p_source_route_id
  ) sub
  WHERE route_stops.id = sub.id;

  -- Delete source route (no more stops, safe to delete)
  DELETE FROM routes WHERE id = p_source_route_id;

  -- Update destination stats
  PERFORM update_route_stats(p_destination_route_id);

  -- Return total stop count
  SELECT count(*) INTO v_total_stops
  FROM route_stops WHERE route_id = p_destination_route_id;

  RETURN v_total_stops;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + @dnd-kit/sortable | 2023 (rbd deprecated by Atlassian) | Must use @dnd-kit; rbd has no React 18/19 support |
| @dnd-kit/react (new API) | @dnd-kit/core + sortable (stable) | 2024 (0.x beta) | New API is still pre-1.0; stick with stable core+sortable |
| Sequential Supabase calls | Atomic PostgreSQL RPCs | Project convention | Trigger safety, transaction guarantees |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Deprecated by Atlassian, no React 18/19 support
- `react-dnd`: Works but heavier, no built-in sortable, less ergonomic API
- `@dnd-kit/react` (v0.3.2): Different API from core+sortable, still beta

## Open Questions

1. **isManuallyReordered persistence**
   - What we know: `RouteDetailClient` has `useState(false)` for `isManuallyReordered` -- it's client-only state, resets on page reload
   - What's unclear: Whether this should persist to DB (a column on routes table) or remain ephemeral
   - Recommendation: Keep as client-only for now. The existing `optimized_polyline: null` clear on reorder is the server-side indicator. Badge shows when polyline is null + route has >1 stop. Phase 100 CONTEXT.md says "verify during research whether DB column or client-only state" -- answer: it's client-only state currently, and clearing optimized_polyline serves as the server-side equivalent.

2. **Route list cache invalidation after split/merge**
   - What we know: Split creates new route, merge deletes a route. Route list page needs updated data.
   - What's unclear: Query key structure for route list
   - Recommendation: Invalidate all queries matching `/api/admin/routes` prefix. The existing codebase uses raw fetch (no React Query yet for this view), so split/merge API handlers just need to return success -- the route list will fetch fresh data on next navigation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | vitest.config.ts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:ci` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | Reorder stop indices via batch_update_stop_indices | unit | `pnpm vitest run src/lib/hooks/__tests__/useReorderStops.test.ts -x` | No -- Wave 0 |
| ROUTE-02 | Move-up/move-down produces correct reordered array | unit | `pnpm vitest run src/lib/hooks/__tests__/useReorderStops.test.ts -x` | No -- Wave 0 |
| ROUTE-03 | Split route validation (min 1 remaining, only pending selectable) | unit | `pnpm vitest run src/lib/hooks/__tests__/useSplitRoute.test.ts -x` | No -- Wave 0 |
| ROUTE-03 | Split route Zod schema edge cases | unit | `pnpm vitest run src/lib/validations/__tests__/route.test.ts -x` | Yes (extend) |
| ROUTE-04 | Merge route validation (same-date, planned only) | unit | `pnpm vitest run src/lib/hooks/__tests__/useMergeRoutes.test.ts -x` | No -- Wave 0 |
| ROUTE-04 | Merge route Zod schema edge cases | unit | `pnpm vitest run src/lib/validations/__tests__/route.test.ts -x` | Yes (extend) |
| ROUTE-05 | Reassign driver mutation + confirmation logic | unit | `pnpm vitest run src/lib/hooks/__tests__/useReassignDriver.test.ts -x` | No -- Wave 0 |
| ALL | Selection logic (toggle, select all, min 1 remaining) | unit | `pnpm vitest run src/components/ui/admin/routes/__tests__/route-selection.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test:ci`
- **Phase gate:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`

### Wave 0 Gaps
- [ ] `src/lib/hooks/__tests__/useReorderStops.test.ts` -- covers ROUTE-01, ROUTE-02
- [ ] `src/lib/hooks/__tests__/useSplitRoute.test.ts` -- covers ROUTE-03
- [ ] `src/lib/hooks/__tests__/useMergeRoutes.test.ts` -- covers ROUTE-04
- [ ] `src/lib/hooks/__tests__/useReassignDriver.test.ts` -- covers ROUTE-05
- [ ] `src/components/ui/admin/routes/__tests__/route-selection.test.ts` -- covers selection logic
- [ ] Extend `src/lib/validations/__tests__/route.test.ts` -- split/merge schema validation

## Sources

### Primary (HIGH confidence)
- [npm: @dnd-kit/core](https://www.npmjs.com/package/@dnd-kit/core) -- version 6.3.1, peerDeps: react >= 16.8.0
- [npm: @dnd-kit/sortable](https://www.npmjs.com/package/@dnd-kit/sortable) -- version 10.0.0, peerDeps: react >= 16.8.0, @dnd-kit/core ^6.3.0
- [npm: @dnd-kit/utilities](https://www.npmjs.com/package/@dnd-kit/utilities) -- version 3.2.2
- [dnd-kit Sortable docs](https://dndkit.com/presets/sortable) -- SortableContext, useSortable, verticalListSortingStrategy, arrayMove
- [dnd-kit Sensors docs](https://dndkit.com/api-documentation/sensors) -- PointerSensor, KeyboardSensor, activation constraints
- [dnd-kit DragOverlay docs](https://dndkit.com/api-documentation/draggable/drag-overlay) -- Props, portal behavior, drop animation
- Existing codebase: supabase/migrations/20260312_route_pipeline_hardening.sql, 20260313_fix_stop_index_unique_deferrable.sql

### Secondary (MEDIUM confidence)
- [GitHub issue #1654: @dnd-kit/react "use client"](https://github.com/clauderic/dnd-kit/issues/1654) -- confirms @dnd-kit/react is the newer API, separate from core+sortable
- [GitHub issue #1194: future of library](https://github.com/clauderic/dnd-kit/issues/1194) -- core+sortable still maintained

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified npm registry peer deps, React 19 compatible
- Architecture: HIGH -- patterns derived from official docs + existing codebase analysis
- Pitfalls: HIGH -- trigger behavior verified from actual migration SQL, DragOverlay patterns from official docs

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable libraries, unlikely to change)
