import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCoverage } from "@/lib/services/coverage";
import { geocodeAddress } from "@/lib/services/geocoding";
import { addressFormSchema } from "@/lib/validations/address";
import { transformAddress, type AddressRow } from "../transform";
import { logger } from "@/lib/utils/logger";

// GET /api/addresses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { data: address, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .returns<AddressRow>()
      .single();

    if (error || !address) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Address not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    logger.exception(error, { api: "addresses/[id]" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch address" } },
      { status: 500 }
    );
  }
}

// PUT /api/addresses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json();
    const result = addressFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .returns<Pick<AddressRow, "id">>()
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Address not found" } },
        { status: 404 }
      );
    }

    const { label, line1, line2, city, state, postalCode } = result.data;
    const fullAddress = `${line1}, ${city}, ${state} ${postalCode}`;
    const geocode = await geocodeAddress(fullAddress);

    if (!geocode.isValid) {
      return NextResponse.json(
        { error: { code: "GEOCODE_FAILED", message: "Could not verify address" } },
        { status: 400 }
      );
    }

    const coverage = await checkCoverage(geocode.lat, geocode.lng);

    if (!coverage.isValid) {
      return NextResponse.json(
        { error: { code: "OUT_OF_COVERAGE", details: coverage } },
        { status: 400 }
      );
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .update({
        label,
        line_1: line1,
        line_2: line2 ?? null,
        city,
        state,
        postal_code: postalCode,
        formatted_address: geocode.formattedAddress,
        lat: geocode.lat,
        lng: geocode.lng,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .returns<AddressRow>()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    logger.exception(error, { api: "addresses/[id]" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update address" } },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    logger.exception(error, { api: "addresses/[id]" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete address" } },
      { status: 500 }
    );
  }
}
