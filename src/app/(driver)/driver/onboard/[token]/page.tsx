import { createPublicClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/ui/driver/OnboardingForm";
import { AlertCircle } from "lucide-react";
import type { ReactElement } from "react";

interface DriverInviteRow {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

async function validateToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  expiresAt?: string;
  error?: string;
}> {
  const supabase = createPublicClient();

  // Query for valid invite token
  const { data: invite, error } = await supabase
    .from("driver_invites")
    .select("id, email, token, expires_at, accepted_at, revoked_at")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .is("accepted_at", null)
    .is("revoked_at", null)
    .returns<DriverInviteRow[]>()
    .single();

  if (error || !invite) {
    return {
      valid: false,
      error: "This invitation link is invalid or has expired",
    };
  }

  return {
    valid: true,
    email: invite.email,
    expiresAt: invite.expires_at,
  };
}

function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `Expires in ${diffHours} hour${diffHours !== 1 ? "s" : ""} and ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  }
  if (diffMinutes > 0) {
    return `Expires in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  }
  return "Expires soon";
}

export default async function DriverOnboardPage({
  params,
}: PageProps): Promise<ReactElement> {
  const { token } = await params;
  const { valid, email, expiresAt, error } = await validateToken(token);

  if (!valid || !email || !expiresAt) {
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
                    Invalid Invitation
                  </h2>
                  <p className="text-sm text-text-secondary mb-4">{error}</p>
                  <p className="text-sm text-text-muted">
                    Please contact your administrator to request a new
                    invitation link.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
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
                {email}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              {formatExpirationDate(expiresAt)}
            </p>
            <OnboardingForm email={email} token={token} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
