# docs/v2-spec.md — V2 Feature Specifications

> **Version**: 1.0
> **Status**: Planned
> **Target**: Weeks 5-8

---

## Overview

V2 focuses on **delivery operations**: driver management, route optimization, real-time tracking, and enhanced admin capabilities.

---

## 1. Driver Management System

### 1.1 User Stories

**US-D.1.1**: As an admin, I want to onboard drivers so they can access their routes.

**US-D.1.2**: As a driver, I want to view my assigned route so I know where to deliver.

**US-D.1.3**: As a driver, I want to update delivery status so customers are informed.

### 1.2 Driver Profile

#### Data Model Extension

```sql
-- Extend drivers table
ALTER TABLE drivers ADD COLUMN vehicle_type text;
ALTER TABLE drivers ADD COLUMN license_plate text;
ALTER TABLE drivers ADD COLUMN phone text;
ALTER TABLE drivers ADD COLUMN profile_image_url text;
ALTER TABLE drivers ADD COLUMN onboarding_completed_at timestamptz;
ALTER TABLE drivers ADD COLUMN rating_avg numeric(3,2);
ALTER TABLE drivers ADD COLUMN deliveries_count int DEFAULT 0;
```

#### Driver Onboarding Flow
1. Admin creates driver account (email invite)
2. Driver sets password
3. Driver completes profile (photo, vehicle info)
4. Admin approves driver
5. Driver gains access to mobile interface

### 1.3 Admin Driver Management

#### Acceptance Criteria
- [ ] List all drivers with status
- [ ] Add new driver (sends email invite)
- [ ] Edit driver details
- [ ] Activate/deactivate driver
- [ ] View driver performance stats
- [ ] Assign driver to Saturday routes

---

## 2. Route Planning System

### 2.1 User Stories

**US-R.2.1**: As an admin, I want to create delivery routes for Saturday so drivers have clear assignments.

**US-R.2.2**: As an admin, I want route optimization suggestions so deliveries are efficient.

**US-R.2.3**: As a driver, I want optimized stop order so I minimize drive time.

### 2.2 Route Data Model

```sql
-- routes table (already defined in V0 schema)
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_date date NOT NULL,
  driver_id uuid REFERENCES drivers(id),
  status text DEFAULT 'planned', -- planned, in_progress, completed
  optimized_polyline text,
  stats_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- route_stops table (already defined)
CREATE TABLE route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  stop_index int NOT NULL,
  eta timestamptz,
  status text DEFAULT 'pending', -- pending, enroute, arrived, delivered, skipped
  delivered_at timestamptz,
  delivery_photo_url text,
  delivery_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2.3 Route Optimization

#### Approach Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A) Google Routes Optimization API** | Best results, handles constraints | Cost per request, API limits | ✅ Recommended for V2 |
| **B) Simple nearest-neighbor** | Free, fast | Suboptimal routes | Fallback option |
| **C) OR-Tools (self-hosted)** | Free, powerful | Infra complexity | Future consideration |

#### Optimization Constraints
- Start/end at kitchen (750 Terrado Plaza, Covina)
- Time windows per order
- Max route duration: 4 hours
- Max stops per route: 20

#### API: POST /api/admin/routes/optimize

```typescript
// Request
{
  deliveryDate: string; // "2026-01-18"
  orderIds: string[];   // Orders to include
}

// Response
{
  data: {
    routes: Array<{
      driverId: string | null; // Unassigned initially
      stops: Array<{
        orderId: string;
        stopIndex: number;
        estimatedArrival: string; // ISO timestamp
        distanceFromPrevious: number; // meters
        durationFromPrevious: number; // seconds
      }>;
      totalDistance: number;
      totalDuration: number;
      polyline: string; // Encoded polyline for map
    }>;
    unassignedOrders: string[]; // Orders that couldn't fit
  };
}
```

### 2.4 Admin Route Management UI

#### Acceptance Criteria
- [ ] Calendar view of Saturday dates
- [ ] Click date to manage routes for that day
- [ ] List of confirmed orders for the date
- [ ] Drag-and-drop order assignment to routes
- [ ] "Auto-optimize" button triggers optimization
- [ ] Assign driver to route
- [ ] View route on map with stops
- [ ] Reorder stops manually
- [ ] Print route manifest

---

## 3. Driver Mobile Interface

### 3.1 User Stories

**US-DM.3.1**: As a driver, I want to see today's route so I can start deliveries.

**US-DM.3.2**: As a driver, I want turn-by-turn navigation so I can reach each stop.

**US-DM.3.3**: As a driver, I want to mark deliveries complete so customers are notified.

### 3.2 Driver App Screens

#### Home Screen
- Today's route summary
- Start time / end time
- Number of stops
- "Start Route" button

#### Active Route Screen
- Current stop card (address, time window, items, notes)
- Map with route
- Navigation button (opens Google Maps)
- "Mark Arrived" button
- "Mark Delivered" button
- Swipe to next stop

#### Stop Detail Screen
- Full address with copy button
- Customer notes
- Order items list
- "Call Customer" button
- "Can't Deliver" with reason selection
- Photo capture for proof of delivery
- Signature pad (optional)

#### History Screen
- Past routes
- Earnings summary (if tips enabled)
- Delivery stats

### 3.3 Location Tracking

#### Implementation

```typescript
// Driver app sends location every 5 minutes when route active
interface LocationUpdate {
  driverId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  source: 'mobile';
}

// POST /api/driver/location
// Rate limited: max 1 per minute
// Requires: driver auth, active route
```

#### Privacy Considerations
- Location only tracked during active routes
- Customer sees location only for their order
- Location history retained for 7 days
- Driver can pause tracking (with admin notification)

---

## 4. Customer Order Tracking

### 4.1 User Stories

**US-T.4.1**: As a customer, I want to see my order status in real-time so I know when to expect delivery.

**US-T.4.2**: As a customer, I want to see the driver's location on a map when they're nearby.

### 4.2 Tracking Page Components

```
TrackingPage
├── StatusTimeline
│   ├── StatusStep (completed)
│   ├── StatusStep (current)
│   └── StatusStep (upcoming)
├── ETADisplay
│   └── "Arriving in 15-25 minutes"
├── DeliveryMap (when out_for_delivery)
│   ├── CustomerMarker
│   ├── DriverMarker (live)
│   └── RoutePolyline
├── OrderSummary (collapsible)
├── DriverCard (when assigned)
│   ├── DriverPhoto
│   ├── DriverName
│   └── StopNumber (e.g., "Stop 5 of 12")
└── SupportActions
    ├── "Contact Driver" (when out_for_delivery)
    └── "Contact Support"
```

### 4.3 Real-time Updates

#### Supabase Realtime Subscription

```typescript
// Customer tracking page
const supabase = createClient();

useEffect(() => {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      setOrderStatus(payload.new.status);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'route_stops',
      filter: `order_id=eq.${orderId}`,
    }, (payload) => {
      setStopStatus(payload.new);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [orderId]);
```

#### ETA Calculation

```typescript
function calculateETA(
  driverLocation: LatLng,
  customerLocation: LatLng,
  remainingStops: number,
  avgStopDuration: number = 5 // minutes
): { min: number; max: number } {
  const driveTime = await getRouteDuration(driverLocation, customerLocation);
  const stopBuffer = remainingStops * avgStopDuration;
  
  return {
    min: driveTime + (stopBuffer * 0.5),
    max: driveTime + (stopBuffer * 1.5),
  };
}
```

### 4.4 Notification System

#### SMS Notifications (Twilio)

| Trigger | Message |
|---------|---------|
| Order confirmed | "Your order #123 is confirmed for Saturday 2-3 PM." |
| Out for delivery | "Your order is on the way! Track: {link}" |
| Arriving soon | "Your order arrives in ~10 min. Driver: {name}" |
| Delivered | "Your order has been delivered. Enjoy!" |

#### Email Notifications

| Trigger | Template |
|---------|----------|
| Order confirmed | Full order details + receipt |
| Out for delivery | Tracking link + driver info |
| Delivered | Delivery confirmation + feedback request |

---

## 5. Delivery Proof

### 5.1 Photo Capture

#### Requirements
- [ ] Camera access on driver mobile
- [ ] Compress image (max 1MB)
- [ ] Upload to Supabase Storage
- [ ] Link to route_stop record
- [ ] Display on order status page

#### Storage Schema

```
supabase-storage/
└── delivery-photos/
    └── {route_id}/
        └── {order_id}.jpg
```

### 5.2 Signature Capture (Optional V2.1)

- Canvas-based signature pad
- Convert to PNG
- Store alongside delivery photo

---

## 6. Admin Dashboard Enhancements

### 6.1 Delivery Operations View

#### Acceptance Criteria
- [ ] Saturday calendar view
- [ ] Route status cards per driver
- [ ] Real-time driver locations on map
- [ ] Delivery progress (completed/total)
- [ ] Exception alerts (late, issue reported)

### 6.2 Analytics Dashboard

#### Metrics to Display
- Orders per Saturday (trend)
- Revenue per Saturday
- Average order value
- Delivery success rate
- Average delivery time
- Coverage area heatmap
- Popular time windows
- Top-selling items

---

## 7. Exception Handling

### 7.1 Delivery Exceptions

| Exception | Driver Action | System Response |
|-----------|--------------|-----------------|
| Customer not home | Mark "attempted", take photo | Notify customer, schedule retry |
| Wrong address | Report issue | Admin intervenes |
| Order damaged | Report with photo | Trigger refund flow |
| Access issue (gate) | Contact customer | Wait 10 min, then mark "undeliverable" |

### 7.2 Exception Data Model

```sql
CREATE TABLE delivery_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_stop_id uuid REFERENCES route_stops(id),
  exception_type text NOT NULL,
  description text,
  photo_url text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);
```

---

## 8. Testing Requirements

### 8.1 Unit Tests
- [ ] Route optimization algorithm
- [ ] ETA calculation logic
- [ ] Location update validation
- [ ] Exception state machine

### 8.2 Integration Tests
- [ ] Route creation + optimization API
- [ ] Location update persistence
- [ ] Realtime subscription delivery
- [ ] Photo upload flow

### 8.3 E2E Tests
- [ ] Admin creates route, assigns driver
- [ ] Driver starts route, updates stops
- [ ] Customer sees live tracking
- [ ] Driver completes delivery with photo

---

## 9. Security Considerations

### 9.1 Driver Authentication
- Session-based with refresh tokens
- Device binding (optional)
- Automatic logout after shift end

### 9.2 Location Privacy
- Customer sees driver location only when relevant
- Location data encrypted at rest
- Retention policy: 7 days

### 9.3 RLS Policies

```sql
-- Driver can only update their assigned stops
CREATE POLICY driver_update_own_stops ON route_stops
  FOR UPDATE TO authenticated
  USING (
    route_id IN (
      SELECT id FROM routes
      WHERE driver_id = (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      )
    )
  );

-- Customer can only view their order's route stop
CREATE POLICY customer_view_own_stop ON route_stops
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
```

---

## 10. Rollout Plan

### Phase 1: Admin Route Management (Week 5-6)
- Route CRUD
- Basic optimization (no Google API yet)
- Driver assignment

### Phase 2: Driver Mobile (Week 6-7)
- Driver PWA or responsive web
- Route view + stop updates
- Location tracking

### Phase 3: Customer Tracking (Week 7-8)
- Status timeline
- Real-time updates
- Map integration
- Notifications (SMS/email)

### Phase 4: Polish (Week 8+)
- Photo proof
- Exception handling
- Analytics dashboard
- Performance optimization

---

## 11. Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Google Routes Optimization API | Route planning | Need API key |
| Google Maps JavaScript API | Customer tracking map | Existing key |
| Twilio | SMS notifications | Need account |
| Supabase Realtime | Live updates | Enabled |
| Supabase Storage | Delivery photos | Enabled |

---

## 12. Open Questions (V2)

| Question | Context | Owner |
|----------|---------|-------|
| Driver app: PWA vs native? | Trade-off: reach vs features | Product |
| Tip distribution timing? | Before/after delivery? | Business |
| Route optimization frequency? | Once at cutoff vs on-demand? | Engineering |
| Driver earnings visibility? | Show tips to drivers? | Business |
| Customer rating system? | Rate driver after delivery? | Product |
