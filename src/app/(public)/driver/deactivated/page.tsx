import { redirect } from "next/navigation";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";

interface AdminContactInfo {
  email?: string;
  phone?: string;
}

interface AppSettingRow {
  value: string;
}

export default async function DriverDeactivatedPage(): Promise<ReactElement> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch admin contact info from app_settings
  const serviceSupabase = createServiceClient();
  let contactInfo: AdminContactInfo = {};

  const { data: setting } = await serviceSupabase
    .from("app_settings")
    .select("value")
    .eq("key", "admin_contact_info")
    .returns<AppSettingRow[]>()
    .single();

  if (setting?.value) {
    try {
      contactInfo = JSON.parse(setting.value) as AdminContactInfo;
    } catch {
      // Invalid JSON — ignore
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-brand-red">Morning Star</h1>
          <p className="mt-2 text-text-secondary">Driver Account</p>
        </div>
        <Card variant="alert" alertAccent="error">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-text-primary mb-2">Account Deactivated</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Your driver account has been deactivated. If you believe this is an error, please
                  contact the admin.
                </p>

                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
                  >
                    <Mail className="h-4 w-4" />
                    {contactInfo.email}
                  </a>
                )}

                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
                  >
                    <Phone className="h-4 w-4" />
                    {contactInfo.phone}
                  </a>
                )}

                <Link
                  href="/"
                  className="inline-block mt-4 text-sm text-text-secondary hover:text-text-primary underline"
                >
                  Go to home page
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
