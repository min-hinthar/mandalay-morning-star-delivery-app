import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
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
}

export default async function DriverOnboardPage(): Promise<ReactElement> {
  const supabase = await createClient();

  // Check if user is authenticated via Supabase invite link
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Debug: Log auth state (visible in server logs)
  console.log("[DriverOnboard] Auth state:", {
    hasUser: !!user,
    authError: authError?.message,
    email: user?.email,
    role: user?.user_metadata?.role,
    inviteId: user?.user_metadata?.invite_id,
  });

  // Not authenticated - show message to check email
  if (authError || !user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-brand-red">
              Morning Star
            </h1>
            <p className="mt-2 text-muted">Driver Onboarding</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 rounded-full bg-surface-secondary">
                  <Mail className="h-8 w-8 text-brand-red" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-sm text-text-secondary">
                    You should have received an invitation email. Click the link
                    in that email to continue your registration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Debug info */}
          <p className="mt-4 text-xs text-center text-gray-400">
            State: not_authenticated | Error: {authError?.message || "none"}
          </p>
        </div>
      </main>
    );
  }

  // Check if user has pending invite via user metadata
  const inviteId = user.user_metadata?.invite_id as string | undefined;
  const userRole = user.user_metadata?.role as string | undefined;

  // Verify user was invited as driver
  if (userRole !== "driver" || !inviteId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-brand-red">
              Morning Star
            </h1>
            <p className="mt-2 text-muted">Driver Onboarding</p>
          </div>
          <Card variant="alert" alertAccent="error">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-text-primary mb-2">
                    Invalid Access
                  </h2>
                  <p className="text-sm text-text-secondary mb-4">
                    This page is only accessible through a valid driver
                    invitation link.
                  </p>
                  <p className="text-sm text-text-muted">
                    Please contact your administrator to request an invitation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Debug info */}
          <p className="mt-4 text-xs text-center text-gray-400">
            State: invalid_role | Role: {userRole || "none"} | InviteId: {inviteId || "none"} | Email: {user.email}
          </p>
          <p className="mt-1 text-xs text-center text-gray-400 break-all">
            Metadata: {JSON.stringify(user.user_metadata)}
          </p>
        </div>
      </main>
    );
  }

  // Check if invite is still valid
  const { data: invite, error: inviteError } = await supabase
    .from("driver_invites")
    .select("id, accepted_at")
    .eq("id", inviteId)
    .returns<InviteRow[]>()
    .single();

  // Debug: Log invite lookup
  console.log("[DriverOnboard] Invite lookup:", {
    inviteId,
    found: !!invite,
    error: inviteError?.message,
    code: inviteError?.code,
  });

  if (!invite) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-brand-red">
              Morning Star
            </h1>
            <p className="mt-2 text-muted">Driver Onboarding</p>
          </div>
          <Card variant="alert" alertAccent="error">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-text-primary mb-2">
                    Invitation Not Found
                  </h2>
                  <p className="text-sm text-text-secondary">
                    This invitation link is no longer valid. Please contact your
                    administrator.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Debug info */}
          <p className="mt-4 text-xs text-center text-gray-400">
            State: invite_not_found | ID: {inviteId} | Error: {inviteError?.message || "none"}
          </p>
        </div>
      </main>
    );
  }

  // Check if already completed onboarding
  if (invite.accepted_at) {
    // Check if they have a driver record
    const { data: driver } = await supabase
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
          <p className="mt-2 text-text-secondary">
            Complete Your Driver Registration
          </p>
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
              <label className="text-sm font-medium text-text-secondary">
                Email Address
              </label>
              <p className="text-sm text-text-primary bg-surface-secondary px-3 py-2 rounded-input">
                {user.email}
              </p>
            </div>
            <OnboardingForm email={user.email ?? ""} inviteId={inviteId} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
