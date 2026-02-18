import { redirect } from "next/navigation";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/ui/driver/OnboardingForm";
import { AlertCircle, Mail } from "lucide-react";
import type { ReactElement } from "react";

interface DriverRow {
  id: string;
}

interface InviteRow {
  id: string;
  accepted_at: string | null;
  email: string;
}

export default async function DriverOnboardPage(): Promise<ReactElement> {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Not authenticated - show message to check email
  if (authError || !user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-brand-red">Morning Star</h1>
            <p className="mt-2 text-muted">Driver Onboarding</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 rounded-full bg-surface-secondary">
                  <Mail className="h-8 w-8 text-brand-red" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary mb-2">Check Your Email</h2>
                  <p className="text-sm text-text-secondary">
                    You should have received an invitation email. Click the link in that email to
                    continue your registration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const email = user.email;
  if (!email) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="alert" alertAccent="error">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-text-primary mb-2">Account Error</h2>
                  <p className="text-sm text-text-secondary">
                    Your account is missing an email address. Please contact support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Use service client to check for invite by email (bypasses RLS)
  const serviceSupabase = createServiceClient();

  // First try user metadata (if set by callback)
  let inviteId = user.user_metadata?.invite_id as string | undefined;
  let invite: InviteRow | null = null;

  // If no invite_id in metadata, look up by email
  if (!inviteId) {
    const { data: inviteByEmail } = await serviceSupabase
      .from("driver_invites")
      .select("id, accepted_at, email")
      .eq("email", email.toLowerCase())
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .returns<InviteRow[]>()
      .limit(1)
      .single();

    if (inviteByEmail) {
      inviteId = inviteByEmail.id;
      invite = inviteByEmail;

      // Update user metadata for future requests
      await serviceSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          role: "driver",
          invite_id: inviteId,
        },
      });
    }
  } else {
    // Verify invite by ID
    const { data: inviteById } = await serviceSupabase
      .from("driver_invites")
      .select("id, accepted_at, email")
      .eq("id", inviteId)
      .returns<InviteRow[]>()
      .single();

    invite = inviteById;
  }

  // No valid invite found
  if (!invite) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-brand-red">Morning Star</h1>
            <p className="mt-2 text-muted">Driver Onboarding</p>
          </div>
          <Card variant="alert" alertAccent="error">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-text-primary mb-2">No Invitation Found</h2>
                  <p className="text-sm text-text-secondary mb-4">
                    We couldn&apos;t find a pending driver invitation for your email ({email}).
                  </p>
                  <p className="text-sm text-text-muted">
                    Please contact your administrator to request an invitation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Check if already completed onboarding
  if (invite.accepted_at) {
    // Check if they have a driver record
    const { data: driver } = await serviceSupabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .returns<DriverRow[]>()
      .single();

    if (driver) {
      // Already onboarded - redirect to driver dashboard
      redirect("/driver");
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-brand-red">Morning Star</h1>
          <p className="mt-2 text-text-secondary">Complete Your Driver Registration</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Team</CardTitle>
            <p className="text-sm text-text-secondary mt-1">
              Complete your registration to start delivering with Morning Star.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary">Email Address</label>
              <p className="text-sm text-text-primary bg-surface-secondary px-3 py-2 rounded-input">
                {email}
              </p>
            </div>
            <OnboardingForm email={email} inviteId={inviteId!} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
