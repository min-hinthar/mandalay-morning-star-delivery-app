import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCoverage } from "@/lib/services/coverage";
import { geocodeAddress } from "@/lib/services/geocoding";
import {
  addressFormSchema,
  type AddressFormValues,
} from "@/lib/validations/address";
import { transformAddress, type AddressRow } from "./transform";

// GET /api/addresses - List user's addresses
export async function GET() {
  try {
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

    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<AddressRow[]>();

    if (error) throw error;

    return NextResponse.json({
      data: (addresses ?? []).map(transformAddress),
      meta: { count: addresses?.length ?? 0 },
    });
  } catch (error) {
    console.error("Addresses GET error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch addresses" } },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
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

    const { label, line1, line2, city, state, postalCode } =
      result.data as AddressFormValues;

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
        {
          error: {
            code: "OUT_OF_COVERAGE",
            message: "Address is outside our delivery area",
            details: coverage,
          },
        },
        { status: 400 }
      );
    }

    const { count } = await supabase
      .from("addresses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const isFirstAddress = !count || count === 0;

    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label,
        line_1: line1,
        line_2: line2 ?? null,
        city,
        state,
        postal_code: postalCode,
        formatted_address: geocode.formattedAddress,
        lat: geocode.lat,
        lng: geocode.lng,
        is_default: isFirstAddress,
        is_verified: true,
      })
      .select()
      .returns<AddressRow>()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: transformAddress(address),
      meta: { coverage },
    });
  } catch (error) {
    console.error("Addresses POST error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create address" } },
      { status: 500 }
    );
  }
}
