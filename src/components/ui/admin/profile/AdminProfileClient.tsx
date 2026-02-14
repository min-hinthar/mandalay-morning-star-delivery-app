"use client";

/**
 * AdminProfileClient
 * Main admin profile page: fetches profile, manages form state,
 * renders card sections, save button, and sign out.
 */

import { useState, useEffect, useCallback } from "react";
import { LogOut } from "lucide-react";
import { toast } from "@/lib/hooks/useToast";
import { signOut } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/admin/settings/SaveButton";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { Skeleton } from "@/components/ui/skeleton/base";
import { ProfileInfoCard } from "./ProfileInfoCard";
import { ActivityStatsCard } from "./ActivityStatsCard";
import { NotificationPrefsCard } from "./NotificationPrefsCard";
import { ThemeCard } from "./ThemeCard";
import type { AdminProfile } from "./types";

export function AdminProfileClient() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Track original values for dirty detection
  const [originalFullName, setOriginalFullName] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");

  const isDirty = fullName !== originalFullName || phone !== originalPhone;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const json = await res.json();
      const data = json.data as AdminProfile;
      setProfile(data);
      setFullName(data.fullName ?? "");
      setPhone(data.phone ?? "");
      setOriginalFullName(data.fullName ?? "");
      setOriginalPhone(data.phone ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName || undefined,
          phone: phone || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Failed to update profile");
      }

      const json = await res.json();
      const data = json.data as AdminProfile;
      setProfile(data);
      setOriginalFullName(data.fullName ?? "");
      setOriginalPhone(data.phone ?? "");
      setFullName(data.fullName ?? "");
      setPhone(data.phone ?? "");

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
      return true;
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      });
      return false;
    }
  }, [fullName, phone]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="rounded-card border border-status-error bg-status-error-bg p-6 text-center">
          <p className="text-status-error font-medium">
            {error ?? "Profile not found"}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchProfile}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <AdminPageHeader
        title="Profile"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Profile" },
        ]}
        actions={
          <SaveButton
            onClick={handleSave}
            hasChanges={isDirty}
          />
        }
      />

      {/* Profile info card */}
      <ProfileInfoCard
        profile={profile}
        fullName={fullName}
        phone={phone}
        onFullNameChange={setFullName}
        onPhoneChange={setPhone}
      />

      {/* Activity stats */}
      <ActivityStatsCard />

      {/* Notification preferences */}
      <NotificationPrefsCard />

      {/* Theme */}
      <ThemeCard />

      {/* Sign out */}
      <div className="pt-4 border-t border-border">
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="text-status-error border-status-error/30 hover:bg-status-error-bg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
