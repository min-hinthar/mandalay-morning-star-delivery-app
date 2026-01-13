import { NextResponse } from "next/server";
import { CoverageCheckRequestSchema } from "@/lib/validators/coverage";
import {
  geocodeAddress,
  getDistanceMatrix,
  metersToMiles,
  secondsToMinutes,
} from "@/lib/maps/client";

const KITCHEN_LAT = Number.parseFloat(process.env.KITCHEN_LAT ?? "34.0900");
const KITCHEN_LNG = Number.parseFloat(process.env.KITCHEN_LNG ?? "-117.8903");
const MAX_DISTANCE_MILES = Number.parseInt(process.env.MAX_DISTANCE_MILES ?? "50", 10);
const MAX_DURATION_MINUTES = Number.parseInt(process.env.MAX_DURATION_MINUTES ?? "90", 10);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = CoverageCheckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { address } = parsed.data;
    const geocoded = await geocodeAddress(address);

    if (!geocoded) {
      return NextResponse.json(
        { error: "Unable to find address. Please enter a valid address." },
        { status: 400 }
      );
    }

    const distance = await getDistanceMatrix(
      KITCHEN_LAT,
      KITCHEN_LNG,
      geocoded.lat,
      geocoded.lng
    );

    if (!distance) {
      return NextResponse.json(
        { error: "Unable to calculate distance. Please try again." },
        { status: 500 }
      );
    }

    const distanceMiles = Math.round(metersToMiles(distance.distance_meters) * 10) / 10;
    const durationMinutes = secondsToMinutes(distance.duration_seconds);

    const withinDistance = distanceMiles <= MAX_DISTANCE_MILES;
    const withinDuration = durationMinutes <= MAX_DURATION_MINUTES;
    const deliverable = withinDistance && withinDuration;

    let reason: string | undefined;
    if (!deliverable) {
      if (!withinDistance && !withinDuration) {
        reason = `Address is ${distanceMiles} miles away (max ${MAX_DISTANCE_MILES}) and ${durationMinutes} min drive (max ${MAX_DURATION_MINUTES})`;
      } else if (!withinDistance) {
        reason = `Address is ${distanceMiles} miles away (max ${MAX_DISTANCE_MILES} miles)`;
      } else {
        reason = `Drive time is ${durationMinutes} minutes (max ${MAX_DURATION_MINUTES} minutes)`;
      }
    }

    return NextResponse.json({
      deliverable,
      distance_miles: distanceMiles,
      duration_minutes: durationMinutes,
      formatted_address: geocoded.formatted_address,
      reason,
    });
  } catch (error) {
    console.error("Coverage check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
