import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAddressSchema } from "@/lib/validations/account";
import { logger } from "@/lib/utils/logger";

const MAX_ADDRESSES = 5;

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

// GET /api/account/addresses - List user's addresses
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
      meta: { count: addresses?.length ?? 0, max: MAX_ADDRESSES },
    });
  } catch (error) {
    logger.exception(error, { api: "account/addresses" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch addresses" } },
      { status: 500 }
    );
  }
}

// POST /api/account/addresses - Create new address
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
    const result = createAddressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    // Check address count limit
    const { count } = await supabase
      .from("addresses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count !== null && count >= MAX_ADDRESSES) {
      return NextResponse.json(
        {
          error: {
            code: "ADDRESS_LIMIT",
            message: `Maximum of ${MAX_ADDRESSES} addresses allowed`,
          },
        },
        { status: 400 }
      );
    }

    const { label, line1, line2, city, state, postalCode, lat, lng, isDefault } = result.data;

    const isFirstAddress = !count || count === 0;
    const shouldBeDefault = isDefault || isFirstAddress;

    // If new address is default, unset default on others
    if (shouldBeDefault && count && count > 0) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label: label ?? "Home",
        line_1: line1,
        line_2: line2 ?? null,
        city,
        state,
        postal_code: postalCode,
        lat: lat ?? null,
        lng: lng ?? null,
        is_default: shouldBeDefault,
        is_verified: false,
      })
      .select()
      .returns<AddressRow>()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: transformAddress(address) });
  } catch (error) {
    logger.exception(error, { api: "account/addresses" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create address" } },
      { status: 500 }
    );
  }
}
