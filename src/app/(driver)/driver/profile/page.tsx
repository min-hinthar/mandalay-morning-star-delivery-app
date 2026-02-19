import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverHeader } from "@/components/ui/driver/DriverHeader";
import { ProfilePageClient } from "./ProfilePageClient";
import { Skeleton } from "@/components/ui/skeleton/base";
import type { VehicleType } from "@/types/driver";

interface DriverProfileRow {
  id: string;
  vehicle_type: string | null;
  license_plate: string | null;
  phone: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface ProfileRow {
  full_name: string | null;
  email: string | null;
}

async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver/profile");
  }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, vehicle_type, license_plate, phone, profile_image_url, is_active, created_at")
    .eq("user_id", user.id)
    .returns<DriverProfileRow[]>()
    .single();

  if (driverError || !driver) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .returns<ProfileRow[]>()
    .single();

  return {
    driverId: driver.id,
    fullName: profile?.full_name ?? null,
    email: profile?.email ?? user.email ?? null,
    phone: driver.phone,
    vehicleType: driver.vehicle_type as VehicleType | null,
    licensePlate: driver.license_plate,
    profileImageUrl: driver.profile_image_url,
    isActive: driver.is_active,
    createdAt: driver.created_at,
  };
}

function ProfileLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton width={96} height={96} radius="full" variant="shimmer" />
        <Skeleton width={120} height={16} radius="md" variant="shimmer" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton width={80} height={16} radius="md" variant="shimmer" />
            <Skeleton width="100%" height={44} radius="lg" variant="shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DriverProfilePage() {
  return (
    <>
      <DriverHeader title="Profile" showBack backHref="/driver" />
      <Suspense fallback={<ProfileLoading />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const data = await getProfileData();
  return <ProfilePageClient {...data} />;
}
