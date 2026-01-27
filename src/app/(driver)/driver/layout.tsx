import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriverNav } from "@/components/ui/driver/DriverNav";
import { DriverShell } from "@/components/ui/driver/DriverShell";
import type { DriversRow } from "@/types/driver";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver");
  }

  // Check if user is an active driver
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, user_id, is_active, vehicle_type, rating_avg, deliveries_count")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<Pick<DriversRow, "id" | "user_id" | "is_active" | "vehicle_type" | "rating_avg" | "deliveries_count">[]>()
    .single();

  if (driverError || !driver) {
    // Not a driver - redirect to home
    redirect("/?error=not_driver");
  }

  return (
    <DriverShell>
      <div className="flex min-h-screen flex-col bg-cream">
        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-auto pb-20">
          {children}
        </main>

        {/* Fixed bottom navigation */}
        <DriverNav />
      </div>
    </DriverShell>
  );
}
