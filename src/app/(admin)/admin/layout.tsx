import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getRoleDashboard } from "@/lib/auth/role-redirect";
import { AdminNav } from "@/components/ui/admin/AdminNav";
import { AdminMobileHeader } from "@/components/ui/admin/AdminMobileHeader";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";
import type { ProfileRole } from "@/types/database";

interface ProfileRow {
  role: ProfileRole;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin");
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileRow[]>()
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    // Not authorized — silently redirect to user's own dashboard (no error param)
    const serviceSupabase = createServiceClient();
    const result = await getRoleDashboard(serviceSupabase, user.id, user.email);
    redirect(result.path);
  }

  return (
    <DomMaxProvider>
      <div className="flex min-h-screen bg-cream">
        {/* Desktop sidebar -- hidden on mobile */}
        <div className="hidden md:block">
          <AdminNav />
        </div>
        {/* Mobile header -- hidden on desktop (md:hidden is inside the component) */}
        <AdminMobileHeader />
        {/* Main content with mobile header offset */}
        <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
      </div>
    </DomMaxProvider>
  );
}
