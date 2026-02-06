"use client";

/**
 * Profile Tab Component
 * Display and edit user profile information
 *
 * Features:
 * - Display full name, email, phone, member since
 * - Edit name and phone (email requires verification)
 * - Inline validation on submit
 * - Skeleton loading state
 * - Save button with spinner and success checkmark
 */

import { useState, useEffect, useCallback } from "react";
import { User, Calendar, Mail, Phone, Check } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { format, parseISO } from "date-fns";

interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

// Validation rules
const VALIDATION = {
  fullName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\p{M}\s'-]+$/u,
  },
  phone: {
    pattern: /^[\d\s\-+()]{7,20}$/,
  },
};

export function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasError, setHasError] = useState(false);
  const { shouldAnimate } = useAnimationPreference();

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/account/profile");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to fetch profile");
        }

        setProfile(result.data);
        setFullName(result.data.fullName || "");
        setPhone(result.data.phone || "");
      } catch (error) {
        setHasError(true);
        toast({
          message: error instanceof Error ? error.message : "Failed to load profile",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    const nameChanged = fullName !== (profile.fullName || "");
    const phoneChanged = phone !== (profile.phone || "");
    setHasChanges(nameChanged || phoneChanged);
  }, [fullName, phone, profile]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate full name
    const trimmedName = fullName.trim();
    if (trimmedName) {
      if (trimmedName.length < VALIDATION.fullName.minLength) {
        newErrors.fullName = `Name must be at least ${VALIDATION.fullName.minLength} characters`;
      } else if (trimmedName.length > VALIDATION.fullName.maxLength) {
        newErrors.fullName = `Name must be less than ${VALIDATION.fullName.maxLength} characters`;
      } else if (!VALIDATION.fullName.pattern.test(trimmedName)) {
        newErrors.fullName = "Name contains invalid characters";
      }
    }

    // Validate phone (optional but must be valid format if provided)
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !VALIDATION.phone.pattern.test(trimmedPhone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, phone]);

  // Clear field error on change
  const handleFullNameChange = (value: string) => {
    setFullName(value);
    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    // Validate on submit
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Map known errors to inline
        const errorMessage = result.error?.message || "Failed to update profile";
        if (errorMessage.toLowerCase().includes("email")) {
          setErrors({ fullName: errorMessage });
          return;
        }
        throw new Error(errorMessage);
      }

      setProfile(result.data);
      setHasChanges(false);

      // Show success checkmark
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      toast({ message: "Profile updated successfully", type: "success" });
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to update profile",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton width={64} height={64} radius="full" />
            <div className="space-y-2 flex-1">
              <Skeleton height={24} width="60%" radius="sm" />
              <Skeleton height={16} width="40%" radius="sm" />
            </div>
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <Skeleton height={14} width={80} radius="sm" className="mb-2" />
              <Skeleton height={44} width="100%" radius="md" />
            </div>

            {/* Phone */}
            <div>
              <Skeleton height={14} width={120} radius="sm" className="mb-2" />
              <Skeleton height={44} width="100%" radius="md" />
            </div>

            {/* Email */}
            <div>
              <Skeleton height={14} width={100} radius="sm" className="mb-2" />
              <Skeleton height={44} width="100%" radius="md" />
              <Skeleton height={12} width="60%" radius="sm" className="mt-1" />
            </div>

            {/* Member Since */}
            <div>
              <Skeleton height={14} width={100} radius="sm" className="mb-2" />
              <Skeleton height={44} width="100%" radius="md" />
            </div>

            {/* Button */}
            <div className="pt-4">
              <Skeleton height={44} width={140} radius="lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (hasError || !profile) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="rounded-full bg-status-error/10 w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-status-error" />
            </div>
            <h3 className="text-lg font-display font-bold text-text-primary mb-2">
              Failed to load profile
            </h3>
            <p className="font-body text-text-secondary mb-4">
              We couldn&apos;t load your profile information.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const memberSince = profile.createdAt
    ? format(parseISO(profile.createdAt), "MMMM d, yyyy")
    : "Unknown";

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
    >
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-full bg-primary/10 p-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">
                Profile Information
              </h2>
              <p className="text-sm text-text-secondary">
                Manage your personal details
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Full Name - Editable */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                placeholder="Enter your full name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                className={errors.fullName ? "border-status-error focus:ring-status-error" : ""}
              />
              <AnimatePresence>
                {errors.fullName && (
                  <m.p
                    id="fullName-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {errors.fullName}
                  </m.p>
                )}
              </AnimatePresence>
            </div>

            {/* Phone - Editable */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </span>
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter your phone number"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={errors.phone ? "border-status-error focus:ring-status-error" : ""}
              />
              <AnimatePresence>
                {errors.phone && (
                  <m.p
                    id="phone-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {errors.phone}
                  </m.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email - Display Only */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </span>
              </label>
              <div className="bg-surface-secondary rounded-input px-4 py-3 text-text-secondary">
                {profile.email || "No email set"}
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Contact support to change your email address
              </p>
            </div>

            {/* Member Since - Display Only */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </span>
              </label>
              <div className="bg-surface-secondary rounded-input px-4 py-3 text-text-secondary">
                {memberSince}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                isLoading={isSaving}
                className="w-full sm:w-auto min-w-[140px]"
              >
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <m.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Saved!
                    </m.span>
                  ) : (
                    <m.span
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </m.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
