"use client";

import type { ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

interface UpgradeConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function UpgradeConfirmation({
  onConfirm,
  onCancel,
}: UpgradeConfirmationProps): ReactElement {
  return (
    <Card variant="alert" alertAccent="warning">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <ArrowRightLeft className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-text-primary mb-2">Account Role Change</h2>
              <p className="text-sm text-text-secondary">
                You&apos;re currently a customer. Accepting this driver invitation will change your
                account to a driver account. You can still access the menu from your driver
                dashboard.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={onConfirm} className="flex-1">
                Accept &amp; Continue
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
