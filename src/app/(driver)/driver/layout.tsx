import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getRoleDashboard } from "@/lib/auth/role-redirect";
import { DriverNav } from "@/components/ui/driver/DriverNav";
import { DriverShell } from "@/components/ui/driver/DriverShell";
import { DriverAvatarProvider } from "@/components/ui/driver/DriverAvatarContext";
import { SimpleModeProvider } from "@/components/ui/driver/SimpleModeProvider";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";
import type { DriversRow } from "@/types/driver";
import type { ProfileRole } from "@/types/database";

interface ProfileRow {
  role: ProfileRole;
}

interface DriverProfileRow {
  full_name: string | null;
}

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver");
  }

  // Query driver record WITHOUT is_active filter to detect deactivated vs no-record
  const { data: driver } = await supabase
    .from("drivers")
    .select(
      "id, user_id, is_active, vehicle_type, rating_avg, deliveries_count, profile_image_url, simple_mode"
    )
    .eq("user_id", user.id)
    .returns<
      Pick<
        DriversRow,
        | "id"
        | "user_id"
        | "is_active"
        | "vehicle_type"
        | "rating_avg"
        | "deliveries_count"
        | "profile_image_url"
        | "simple_mode"
      >[]
    >()
    .single();

  if (!driver) {
    // No driver record — check profile role to decide where to go
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<ProfileRow>();

    if (profile?.role === "driver") {
      // Has driver role but no driver record — needs onboarding
      redirect("/driver/onboard");
    }

    // Wrong role — silently redirect to their own dashboard
    const serviceSupabase = createServiceClient();
    const result = await getRoleDashboard(serviceSupabase, user.id, user.email);
    redirect(result.path);
  }

  if (!driver.is_active) {
    // Driver record exists but deactivated
    redirect("/driver/deactivated");
  }

  // Get driver name for avatar display
  const { data: driverProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .returns<DriverProfileRow[]>()
    .single();

  const avatarUrl = driver.profile_image_url;
  const driverName = driverProfile?.full_name ?? null;

  const simpleMode = (driver as Record<string, unknown>).simple_mode as boolean | undefined;

  return (
    <DomMaxProvider>
      <DriverAvatarProvider avatarUrl={avatarUrl} driverName={driverName}>
        <SimpleModeProvider initialMode={simpleMode ?? false}>
          <DriverShell>
            <div className="flex min-h-screen flex-col bg-cream">
              {/* Main content area - scrollable */}
              <main className="flex-1 overflow-auto pb-20">{children}</main>

              {/* Fixed bottom navigation */}
              <DriverNav avatarUrl={avatarUrl} driverName={driverName} />
            </div>
          </DriverShell>
        </SimpleModeProvider>
      </DriverAvatarProvider>
    </DomMaxProvider>
  );
}
