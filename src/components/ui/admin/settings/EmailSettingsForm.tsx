"use client";

/**
 * EmailSettingsForm Component
 * Email system settings with kill switch toggle and test email buttons.
 *
 * Kill switch persists via parent SettingsClient save mechanism (app_settings table).
 * Test email buttons call POST /api/emails/test with sample data.
 */

import { useState, useCallback } from "react";
import { Mail, AlertTriangle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { ToggleSwitch } from "./ToggleSwitch";
import type { EmailType } from "@/lib/email/types";

// ===========================================
// TYPES
// ===========================================

interface EmailSettingsFormProps {
  emailEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

interface TestEmailButton {
  type: EmailType;
  label: string;
}

// ===========================================
// CONSTANTS
// ===========================================

const TEST_EMAIL_BUTTONS: TestEmailButton[] = [
  { type: "order_confirmation", label: "Order Confirmation" },
  { type: "cancellation", label: "Cancellation" },
  { type: "refund", label: "Refund" },
  { type: "delivery_reminder", label: "Delivery Reminder" },
];

// ===========================================
// COMPONENT
// ===========================================

export function EmailSettingsForm({ emailEnabled, onToggle }: EmailSettingsFormProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingType, setSendingType] = useState<EmailType | null>(null);

  const handleSendTest = useCallback(
    async (emailType: EmailType) => {
      if (!recipientEmail.trim()) {
        toast({ variant: "warning", description: "Enter a recipient email address" });
        return;
      }

      setSendingType(emailType);
      try {
        const response = await fetch("/api/emails/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailType, recipientEmail: recipientEmail.trim() }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send test email");
        }

        toast({
          variant: "success",
          description: `Test ${emailType.replace(/_/g, " ")} email sent`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send test email";
        toast({ variant: "destructive", description: message });
      } finally {
        setSendingType(null);
      }
    },
    [recipientEmail]
  );

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold text-text-primary">Email System</h2>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Manage outbound email sending and test email templates.
        </p>
      </div>

      {/* Kill Switch */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Email Sending
        </h3>
        <div className="space-y-1 divide-y divide-border-subtle">
          <ToggleSwitch
            id="emailSendingEnabled"
            checked={emailEnabled}
            onChange={onToggle}
            label="Email Sending Enabled"
            description="Master switch to enable/disable all outbound email sending"
          />
        </div>

        {!emailEnabled && (
          <div className="flex items-start gap-3 rounded-card-sm border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800">
              All email sending is disabled. Customers will not receive any transactional emails.
            </p>
          </div>
        )}
      </div>

      {/* Test Email Section */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Send Test Emails
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Send a test email with sample data to verify templates.
          </p>
        </div>

        {/* Recipient Email Input */}
        <div className="space-y-2">
          <Label htmlFor="testRecipientEmail" className="text-sm font-medium">
            Recipient Email
          </Label>
          <Input
            id="testRecipientEmail"
            type="email"
            placeholder="admin@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="max-w-sm"
            disabled={!emailEnabled}
          />
        </div>

        {/* Test Email Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEST_EMAIL_BUTTONS.map(({ type, label }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              disabled={!emailEnabled || sendingType !== null}
              onClick={() => handleSendTest(type)}
              className={cn(
                "justify-start gap-2",
                !emailEnabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {sendingType === type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {label}
            </Button>
          ))}
        </div>

        {!emailEnabled && (
          <p className="text-xs text-text-muted">Enable email sending above to send test emails.</p>
        )}
      </div>
    </div>
  );
}
