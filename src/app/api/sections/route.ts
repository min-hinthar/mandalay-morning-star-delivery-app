import { NextResponse } from "next/server";
import { getFeaturedSections } from "@/lib/queries/sections";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/sections
 * Public endpoint to fetch featured sections with items.
 * Returns visible, non-deleted sections with active menu items.
 * Cached for 60 seconds via CDN headers.
 */
export async function GET() {
  try {
    const sections = await getFeaturedSections();

    return NextResponse.json(
      {
        data: { sections },
        meta: { timestamp: new Date().toISOString() },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    logger.exception(error, { api: "sections", flowId: "fetch" });
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}
