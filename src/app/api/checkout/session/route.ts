import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "checkout-session-not-implemented" }, { status: 501 });
}
