import { NextRequest, NextResponse } from "next/server";
import { CoverageCheckRequestSchema } from "@/lib/validators/coverage";
import {
  checkAddressCoverage,
  checkCoverage,
} from "@/lib/services/coverage";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = CoverageCheckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Please provide an address or coordinates.",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const coverage =
      "address" in data
        ? await checkAddressCoverage(data.address)
        : await checkCoverage(data.lat, data.lng);

    return NextResponse.json({ data: coverage });
  } catch (error) {
    logger.exception(error, { api: "coverage/check" });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Coverage check failed.",
        },
      },
      { status: 500 }
    );
  }
}
