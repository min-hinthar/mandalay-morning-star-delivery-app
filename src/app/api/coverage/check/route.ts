import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ covered: false, reason: "coverage-check-not-implemented" });
}
