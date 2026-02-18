/**
 * Invite Driver Modal
 *
 * Modal for sending driver invite emails.
 * Sends email directly to the driver via Resend.
 */

"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Loader2, Mail, AlertCircle, CheckCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface InviteDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormErrors {
  email?: string;
  general?: string;
}

interface InviteResponse {
  id: string;
  email: string;
  expiresAt: string;
  emailSent: boolean;
  message: string;
  isExistingUser: boolean;
}

export function InviteDriverModal({ open, onOpenChange, onSuccess }: InviteDriverModalProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/admin/drivers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invite");
      }

      const data: InviteResponse = await response.json();
      setInviteResult(data);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create invite";

      // Show in form if it's a validation-type error
      if (message.includes("pending invite") || message.includes("already registered")) {
        setErrors({ email: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail("");
      setErrors({});
      setInviteResult(null);
      onOpenChange(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Show success view after invite email is sent
  if (inviteResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[420px] bg-surface-primary border-border rounded-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
              <div className="p-2 rounded-input bg-green/10 text-green">
                <CheckCircle className="h-5 w-5" />
              </div>
              Invite Sent
            </DialogTitle>
            <DialogDescription className="font-body text-text-secondary">
              An invitation email has been sent to{" "}
              <span className="font-medium text-text-primary">{inviteResult.email}</span>. They can
              use the link in the email to complete registration.
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-text-muted mt-2">
            The invitation link expires in 24 hours. You can resend it from the Pending Invites tab
            if needed.
          </p>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] bg-surface-primary border-border rounded-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-input bg-primary text-text-inverse">
              <Mail className="h-5 w-5" />
            </div>
            Invite Driver
          </DialogTitle>
          <DialogDescription className="font-body text-text-secondary">
            Enter the driver&apos;s email. They&apos;ll receive an invitation with a magic link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* General Error */}
          {errors.general && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-input bg-status-error/10 border border-status-error/20 text-status-error text-sm font-body"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </m.div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="invite-email"
              className="text-sm font-body font-medium text-text-primary"
            >
              Email Address <span className="text-status-error">*</span>
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="driver@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={cn(
                "bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input",
                errors.email &&
                  "border-status-error focus:border-status-error focus:ring-status-error/20"
              )}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.email && (
              <p className="text-xs font-body text-status-error mt-1">{errors.email}</p>
            )}
            <p className="text-xs font-body text-text-muted mt-2">
              Works for both new and existing users.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-border hover:bg-surface-tertiary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
