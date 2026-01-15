import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ routeId: string; stopId: string }>;
}

interface DriverQueryResult {
  id: string;
}

interface RouteQueryResult {
  id: string;
  driver_id: string;
}

interface StopQueryResult {
  id: string;
  route_id: string;
  order_id: string;
}

interface UploadPhotoResponse {
  success: boolean;
  photoUrl: string;
}

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UploadPhotoResponse | { error: string }>> {
  try {
    const { routeId, stopId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get driver
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .returns<DriverQueryResult[]>()
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Not a driver" },
        { status: 403 }
      );
    }

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, driver_id")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    // Verify driver owns this route
    if (route.driver_id !== driver.id) {
      return NextResponse.json(
        { error: "Not authorized to upload photo for this stop" },
        { status: 403 }
      );
    }

    // Get stop to get order_id for filename
    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("id, route_id, order_id")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<StopQueryResult[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json(
        { error: "Stop not found" },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No photo file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size is 5MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // Generate filename
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${routeId}/${stop.order_id}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("delivery-photos")
      .upload(filename, file, {
        contentType: file.type,
        upsert: true, // Allow overwriting if retaking photo
      });

    if (uploadError) {
      console.error("Error uploading photo:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("delivery-photos")
      .getPublicUrl(filename);

    const photoUrl = urlData.publicUrl;

    // Update stop with photo URL
    await supabase
      .from("route_stops")
      .update({ delivery_photo_url: photoUrl })
      .eq("id", stopId);

    return NextResponse.json({
      success: true,
      photoUrl,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
