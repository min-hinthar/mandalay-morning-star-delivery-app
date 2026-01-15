import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformAddress, type AddressRow } from "../../transform";

// POST /api/addresses/[id]/default - Set as default
export async function POST(
  request: Request,
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

    const { data: target, error: fetchError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .returns<Pick<AddressRow, "id">>()
      .single();

    if (fetchError || !target) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Address not found" } },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Unset existing defaults
    await supabase
      .from("addresses")
      .update({ is_default: false, updated_at: now })
      .eq("user_id", user.id);

    const { data: address, error } = await supabase
      .from("addresses")
      .update({ is_default: true, updated_at: now })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
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
    console.error("Address default POST error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to set default" } },
      { status: 500 }
    );
  }
}
