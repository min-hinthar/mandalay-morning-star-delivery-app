# Task: V1-S2-004 — Address Management

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: V0 Auth, V1-S2-005 (Coverage Checker)
> **Branch**: `feat/address-management`

---

## Objective

Implement full address management for customers: listing saved addresses, adding new addresses with Google Geocoding validation, editing existing addresses, setting a default, and deleting addresses. Each address must be validated for delivery coverage before being saved.

---

## Acceptance Criteria

- [ ] List saved addresses with labels (Home, Work, custom)
- [ ] Add new address form with validation
- [ ] Address validated via Google Geocoding API
- [ ] Coverage check on save (distance + duration)
- [ ] Edit existing address
- [ ] Set address as default
- [ ] Delete address with confirmation
- [ ] Delivery notes field (optional)
- [ ] Form validation with Zod
- [ ] RLS policies for user's addresses only
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Address Types

Create `src/types/address.ts`:

```typescript
export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressFormData {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface GeocodingResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  isValid: boolean;
}

export interface CoverageResult {
  isValid: boolean;
  distanceMiles: number;
  durationMinutes: number;
  reason?: 'DISTANCE_EXCEEDED' | 'DURATION_EXCEEDED' | 'GEOCODE_FAILED';
}

// Constants
export const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;
export type AddressLabel = typeof ADDRESS_LABELS[number];
```

### 2. Address Validation Schema

Create `src/lib/validations/address.ts`:

```typescript
import { z } from 'zod';

export const addressFormSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label too long'),
  line1: z.string().min(1, 'Street address is required').max(200),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().length(2, 'Use 2-letter state code').default('CA'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
```

### 3. Address API Routes

Create `src/app/api/addresses/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addressFormSchema } from '@/lib/validations/address';
import { geocodeAddress } from '@/lib/services/geocoding';
import { checkCoverage } from '@/lib/services/coverage';

// GET /api/addresses - List user's addresses
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      data: addresses.map(transformAddress),
    });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch addresses' } },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = addressFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: result.error.issues } },
        { status: 400 }
      );
    }

    const { label, line1, line2, city, state, postalCode } = result.data;

    // Geocode the address
    const fullAddress = `${line1}, ${city}, ${state} ${postalCode}`;
    const geocode = await geocodeAddress(fullAddress);

    if (!geocode.isValid) {
      return NextResponse.json(
        { error: { code: 'GEOCODE_FAILED', message: 'Could not verify address' } },
        { status: 400 }
      );
    }

    // Check coverage
    const coverage = await checkCoverage(geocode.lat, geocode.lng);

    if (!coverage.isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'OUT_OF_COVERAGE',
            message: 'Address is outside our delivery area',
            details: coverage,
          },
        },
        { status: 400 }
      );
    }

    // Check if this is user's first address (make it default)
    const { count } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const isFirstAddress = count === 0;

    // Insert address
    const { data: address, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label,
        line_1: line1,
        line_2: line2 || null,
        city,
        state,
        postal_code: postalCode,
        formatted_address: geocode.formattedAddress,
        lat: geocode.lat,
        lng: geocode.lng,
        is_default: isFirstAddress,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: transformAddress(address),
      meta: { coverage },
    });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create address' } },
      { status: 500 }
    );
  }
}

function transformAddress(row: any): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    line1: row.line_1,
    line2: row.line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    formattedAddress: row.formatted_address,
    lat: row.lat,
    lng: row.lng,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

Create `src/app/api/addresses/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addressFormSchema } from '@/lib/validations/address';
import { geocodeAddress } from '@/lib/services/geocoding';
import { checkCoverage } from '@/lib/services/coverage';

// GET /api/addresses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !address) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Address not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// PUT /api/addresses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = addressFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: result.error.issues } },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const { label, line1, line2, city, state, postalCode } = result.data;

    // Re-geocode if address changed
    const fullAddress = `${line1}, ${city}, ${state} ${postalCode}`;
    const geocode = await geocodeAddress(fullAddress);

    if (!geocode.isValid) {
      return NextResponse.json(
        { error: { code: 'GEOCODE_FAILED' } },
        { status: 400 }
      );
    }

    // Re-check coverage
    const coverage = await checkCoverage(geocode.lat, geocode.lng);

    if (!coverage.isValid) {
      return NextResponse.json(
        { error: { code: 'OUT_OF_COVERAGE', details: coverage } },
        { status: 400 }
      );
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .update({
        label,
        line_1: line1,
        line_2: line2 || null,
        city,
        state,
        postal_code: postalCode,
        formatted_address: geocode.formattedAddress,
        lat: geocode.lat,
        lng: geocode.lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// POST /api/addresses/[id]/default - Set as default
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Unset all defaults for user
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set new default
    const { data: address, error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
```

### 4. Address React Query Hooks

Create `src/lib/hooks/useAddresses.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Address, AddressFormData } from '@/types/address';

export function useAddresses() {
  return useQuery<{ data: Address[] }>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await fetch('/api/addresses');
      if (!res.ok) throw new Error('Failed to fetch addresses');
      return res.json();
    },
  });
}

export function useAddress(id: string) {
  return useQuery<{ data: Address }>({
    queryKey: ['addresses', id],
    queryFn: async () => {
      const res = await fetch(`/api/addresses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch address');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddressFormData) => {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormData }) => {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete address');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to set default');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
```

### 5. Address Form Component

Create `src/components/checkout/AddressForm.tsx`:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addressFormSchema, type AddressFormValues } from '@/lib/validations/address';
import { ADDRESS_LABELS } from '@/types/address';
import { cn } from '@/lib/utils/cn';

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function AddressForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: 'Home',
      state: 'CA',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Select
          value={watch('label')}
          onValueChange={(v) => setValue('label', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select label" />
          </SelectTrigger>
          <SelectContent>
            {ADDRESS_LABELS.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.label && (
          <p className="text-sm text-destructive">{errors.label.message}</p>
        )}
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="line1">Street Address</Label>
        <Input
          id="line1"
          placeholder="123 Main St"
          {...register('line1')}
          className={cn(errors.line1 && 'border-destructive')}
        />
        {errors.line1 && (
          <p className="text-sm text-destructive">{errors.line1.message}</p>
        )}
      </div>

      {/* Apt/Suite */}
      <div className="space-y-2">
        <Label htmlFor="line2">Apt, Suite, etc. (optional)</Label>
        <Input
          id="line2"
          placeholder="Apt 4B"
          {...register('line2')}
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="Los Angeles"
          {...register('city')}
          className={cn(errors.city && 'border-destructive')}
        />
        {errors.city && (
          <p className="text-sm text-destructive">{errors.city.message}</p>
        )}
      </div>

      {/* State & ZIP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="CA"
            maxLength={2}
            {...register('state')}
            className={cn(errors.state && 'border-destructive')}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">ZIP Code</Label>
          <Input
            id="postalCode"
            placeholder="90001"
            {...register('postalCode')}
            className={cn(errors.postalCode && 'border-destructive')}
          />
          {errors.postalCode && (
            <p className="text-sm text-destructive">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? 'Update Address' : 'Add Address'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
```

---

## Test Plan

### API Tests

```bash
# List addresses
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/addresses

# Create address
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Home","line1":"123 Main St","city":"Los Angeles","state":"CA","postalCode":"90001"}' \
  http://localhost:3000/api/addresses

# Update address
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Work","line1":"456 Oak Ave","city":"Covina","state":"CA","postalCode":"91722"}' \
  http://localhost:3000/api/addresses/{id}

# Delete address
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/addresses/{id}
```

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Address types defined
2. [ ] Zod validation schema created
3. [ ] GET /api/addresses returns user's addresses
4. [ ] POST /api/addresses creates with geocoding
5. [ ] PUT /api/addresses/[id] updates address
6. [ ] DELETE /api/addresses/[id] removes address
7. [ ] Set default address works
8. [ ] Coverage validation on create/update
9. [ ] React Query hooks implemented
10. [ ] AddressForm component created
11. [ ] RLS policies verified
12. [ ] `pnpm lint` passes
13. [ ] `pnpm typecheck` passes
14. [ ] `pnpm build` succeeds
15. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Always geocode addresses before saving
- Always check coverage before saving
- First address automatically becomes default
- RLS must restrict to user's own addresses
- Store coordinates for future route optimization
- Use `transformAddress` for snake_case → camelCase
- Handle geocoding failures gracefully with user feedback

---

*Task ready for implementation*
