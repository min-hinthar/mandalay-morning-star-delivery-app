import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/ui/admin/AdminNav";
import type { ProfileRole } from "@/types/database";

interface ProfileRow {
  role: ProfileRole;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

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
    // Not authorized - redirect to home with error
    redirect("/?error=unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
