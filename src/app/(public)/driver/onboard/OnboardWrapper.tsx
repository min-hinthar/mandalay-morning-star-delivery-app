"use client";

import { useState, type ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/ui/driver/OnboardingForm";
import { UpgradeConfirmation } from "@/components/ui/driver/UpgradeConfirmation";
import { useRouter } from "next/navigation";

interface OnboardWrapperProps {
  email: string;
  inviteId: string;
  isUpgrade: boolean;
  invitedBy?: string;
  inviteDate?: string;
  expiryDate?: string;
  inviteEmail?: string;
}

export function OnboardWrapper({
  email,
  inviteId,
  isUpgrade,
  invitedBy,
  inviteDate,
  expiryDate,
  inviteEmail,
}: OnboardWrapperProps): ReactElement {
  const router = useRouter();
  const [upgradeAccepted, setUpgradeAccepted] = useState(false);

  // Show upgrade confirmation first if user is upgrading from customer
  if (isUpgrade && !upgradeAccepted) {
    return (
      <UpgradeConfirmation
        onConfirm={() => setUpgradeAccepted(true)}
        onCancel={() => router.push("/")}
      />
    );
  }

  return (
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
        <OnboardingForm
          email={email}
          inviteId={inviteId}
          invitedBy={invitedBy}
          inviteDate={inviteDate}
          expiryDate={expiryDate}
          inviteEmail={inviteEmail}
        />
      </CardContent>
    </Card>
  );
}
