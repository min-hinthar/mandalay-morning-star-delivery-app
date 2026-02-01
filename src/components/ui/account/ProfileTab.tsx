"use client";

/**
 * Profile Tab Component
 * Display and edit user profile information
 *
 * Features:
 * - Display full name, email, phone, member since
 * - Edit name and phone (email requires verification)
 * - Save changes via PATCH /api/account/profile
 */

import { useState, useEffect } from "react";
import { User, Calendar, Mail, Phone, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
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

  const handleSave = async () => {
    if (!hasChanges) return;

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
        throw new Error(result.error?.message || "Failed to update profile");
      }

      setProfile(result.data);
      setHasChanges(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Failed to load profile</p>
      </div>
    );
  }

  const memberSince = profile.createdAt
    ? format(parseISO(profile.createdAt), "MMMM d, yyyy")
    : "Unknown";

  return (
    <motion.div
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
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
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
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
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
                className="w-full sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
