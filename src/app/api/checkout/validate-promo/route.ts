import { NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/stripe/promo";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code" },
        { status: 400 }
      );
    }

    const result = await validatePromoCode(parsed.data.code);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      discountCents: result.discountCents,
      percentOff: result.percentOff,
      label:
        result.percentOff != null
          ? result.percentOff + "% off"
          : "$" + (result.discountCents / 100).toFixed(2) + " off",
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
