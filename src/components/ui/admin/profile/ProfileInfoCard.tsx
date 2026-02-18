"use client";

/**
 * ProfileInfoCard
 * Displays admin profile info: editable name/phone, read-only email/role/provider/member-since.
 */

import { format, parseISO } from "date-fns";
import { Mail, Phone, Shield, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { AdminProfile } from "./types";

// Hardcoded permissions by role
const PERMISSIONS_MAP: Record<string, string[]> = {
  admin: ["Manage orders", "Manage menu", "Manage drivers", "View analytics"],
  super_admin: [
    "Manage orders",
    "Manage menu",
    "Manage drivers",
    "View analytics",
    "Manage admins",
    "Manage settings",
  ],
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  email: "Email",
  apple: "Apple",
};

interface ProfileInfoCardProps {
  profile: AdminProfile;
  fullName: string;
  phone: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function ProfileInfoCard({
  profile,
  fullName,
  phone,
  onFullNameChange,
  onPhoneChange,
}: ProfileInfoCardProps) {
  const permissions = PERMISSIONS_MAP[profile.role] ?? PERMISSIONS_MAP.admin ?? [];
  const providerLabel = PROVIDER_LABELS[profile.authProvider] ?? profile.authProvider;
  const memberSinceFormatted = (() => {
    try {
      return format(parseISO(profile.memberSince), "MMMM yyyy");
    } catch {
      return "Unknown";
    }
  })();

  const roleBadgeVariant =
    profile.role === "super_admin" ? ("secondary" as const) : ("default" as const);
  const roleLabel = profile.role === "super_admin" ? "Super Admin" : "Admin";

  return (
    <div className="rounded-card border border-border bg-surface-primary p-5 space-y-5">
      <h2 className="font-display text-lg font-semibold text-text-primary">Profile Information</h2>

      {/* Editable fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Full Name</Label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Phone</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+1234567890"
          />
        </div>
      </div>

      {/* Read-only fields */}
      <div className="space-y-3 pt-2 border-t border-border">
        {/* Email */}
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-text-muted shrink-0" />
          <span className="text-text-secondary">Email</span>
          <span className="ml-auto text-text-primary font-medium truncate max-w-[200px]">
            {profile.email}
          </span>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3 text-sm">
          <Shield className="h-4 w-4 text-text-muted shrink-0" />
          <span className="text-text-secondary">Role</span>
          <Badge variant={roleBadgeVariant} size="sm" className="ml-auto">
            {roleLabel}
          </Badge>
        </div>

        {/* Auth provider */}
        <div className="flex items-center gap-3 text-sm">
          <KeyRound className="h-4 w-4 text-text-muted shrink-0" />
          <span className="text-text-secondary">Signed in with</span>
          <span className="ml-auto text-text-primary font-medium">{providerLabel}</span>
        </div>

        {/* Phone display (when viewing, shows icon) */}
        <div className="flex items-center gap-3 text-sm">
          <Phone className="h-4 w-4 text-text-muted shrink-0" />
          <span className="text-text-secondary">Member since</span>
          <span className="ml-auto text-text-primary font-medium">{memberSinceFormatted}</span>
        </div>
      </div>

      {/* Permissions */}
      {permissions.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-text-secondary mb-2">Permissions</p>
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((perm) => (
              <Badge key={perm} variant="outline" size="sm">
                {perm}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
