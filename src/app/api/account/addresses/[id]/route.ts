import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateAddressSchema } from "@/lib/validations/account";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface AddressRow {
  id: string;
  label: string;
  line_1: string;
  line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at: string;
}

function transformAddress(row: AddressRow) {
  return {
    id: row.id,
    label: row.label,
    line1: row.line_1,
    line2: row.line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    lat: row.lat,
    lng: row.lng,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

// PATCH /api/account/addresses/[id] - Update an address
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Verify address belongs to user
    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Address not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateAddressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    const { label, line1, line2, city, state, postalCode, lat, lng, isDefault } = result.data;

    // If setting as default, unset default on others
    if (isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)
        .neq("id", id);
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (label !== undefined) updates.label = label;
    if (line1 !== undefined) updates.line_1 = line1;
    if (line2 !== undefined) updates.line_2 = line2;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (postalCode !== undefined) updates.postal_code = postalCode;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (isDefault !== undefined) updates.is_default = isDefault;

    const { data: address, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .returns<AddressRow>()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    logger.exception(error, { api: "account/addresses/[id]" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update address" } },
      { status: 500 }
    );
  }
}

// DELETE /api/account/addresses/[id] - Delete an address
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Check if address exists and belongs to user
    const { data: existing } = await supabase
      .from("addresses")
      .select("id, is_default")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Address not found" } },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);

    if (error) throw error;

    // If deleted address was default, make the newest one default
    if (existing.is_default) {
      const { data: newest } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (newest) {
        await supabase.from("addresses").update({ is_default: true }).eq("id", newest.id);
      }
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    logger.exception(error, { api: "account/addresses/[id]" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete address" } },
      { status: 500 }
    );
  }
}
