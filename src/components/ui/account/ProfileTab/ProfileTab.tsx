"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Calendar, Mail, Phone, Check } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useRewardsSummary } from "@/lib/hooks/useRewardsSummary";
import { TierBadge } from "@/components/ui/TierBadge";
import { TapBurst, useTapBurst } from "@/components/ui/TapBurst";
import { format, parseISO } from "date-fns";
import type { Profile, FormErrors } from "./types";
import { VALIDATION } from "./types";
import { ProfileSkeleton } from "./ProfileSkeleton";

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
  const { data: rewards } = useRewardsSummary(true);
  const { fireKey, fire } = useTapBurst();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/account/profile");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || "Failed to fetch profile");
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

  useEffect(() => {
    if (!profile) return;
    const nameChanged = fullName !== (profile.fullName || "");
    const phoneChanged = phone !== (profile.phone || "");
    setHasChanges(nameChanged || phoneChanged);
  }, [fullName, phone, profile]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = fullName.trim();
    if (trimmedName) {
      if (trimmedName.length < VALIDATION.fullName.minLength)
        newErrors.fullName = `Name must be at least ${VALIDATION.fullName.minLength} characters`;
      else if (trimmedName.length > VALIDATION.fullName.maxLength)
        newErrors.fullName = `Name must be less than ${VALIDATION.fullName.maxLength} characters`;
      else if (!VALIDATION.fullName.pattern.test(trimmedName))
        newErrors.fullName = "Name contains invalid characters";
    }
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !VALIDATION.phone.pattern.test(trimmedPhone))
      newErrors.phone = "Please enter a valid phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, phone]);

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleSave = async () => {
    if (!hasChanges || !validateForm()) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim() || null, phone: phone.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) {
        const errorMessage = result.error?.message || "Failed to update profile";
        if (errorMessage.toLowerCase().includes("email")) {
          setErrors({ fullName: errorMessage });
          return;
        }
        throw new Error(errorMessage);
      }
      setProfile(result.data);
      setHasChanges(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast({ message: "Profile updated successfully", type: "success" });
      // Celebratory tap-burst + light haptic on a successful save (kit).
      fire();
      navigator.vibrate?.(10);
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to update profile",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  if (hasError || !profile) {
    return (
      <div className="hero-surface-paper relative overflow-hidden rounded-card">
        <HeroCardLayers accent="clay" radius="rounded-card" />
        <div className="relative p-6">
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-error/10">
              <User className="h-8 w-8 text-status-error" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold text-hero-ink">
              Failed to load profile
            </h3>
            <p className="mb-4 font-body text-hero-ink-muted">
              We couldn&apos;t load your profile information.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
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
      <div className="hero-surface-paper relative overflow-hidden rounded-card">
        <HeroCardLayers accent="clay" radius="rounded-card" />
        <div className="relative p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-full bg-hero-clay/12 p-4">
              <User className="h-8 w-8 text-hero-clay" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-hero-ink">Profile Information</h2>
              <p className="text-sm text-hero-ink-muted">Manage your personal details</p>
            </div>
            {rewards && rewards.tier.id !== "new" && (
              <TierBadge tier={rewards.tier} variant="pill" />
            )}
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-hero-ink">
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
                className={
                  errors.fullName ? "border-status-error focus-visible:ring-status-error" : ""
                }
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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-hero-ink">
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
                className={
                  errors.phone ? "border-status-error focus-visible:ring-status-error" : ""
                }
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
              <label className="mb-2 block text-sm font-medium text-hero-ink">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </span>
              </label>
              <div className="rounded-input bg-hero-ink/5 px-4 py-3 text-hero-ink-muted break-all">
                {profile.email || "No email set"}
              </div>
              <p className="mt-1 text-xs text-hero-ink-muted">
                Contact support to change your email address
              </p>
            </div>

            {/* Member Since */}
            <div>
              <label className="mb-2 block text-sm font-medium text-hero-ink">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </span>
              </label>
              <div className="rounded-input bg-hero-ink/5 px-4 py-3 text-hero-ink-muted">
                {memberSince}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <div className="relative inline-block w-full sm:w-auto">
                <TapBurst fireKey={fireKey} />
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
          </div>
        </div>
      </div>
    </m.div>
  );
}
