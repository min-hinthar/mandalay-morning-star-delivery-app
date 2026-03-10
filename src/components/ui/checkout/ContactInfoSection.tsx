"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Phone, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCheckoutStore } from "@/lib/stores/checkout-store";

/**
 * Format a raw digit string as (xxx) xxx-xxxx
 */
function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

interface ContactInfoSectionProps {
  /** Called after successful checkout if saveToProfile is checked */
  saveToProfileRef: React.MutableRefObject<boolean>;
}

export function ContactInfoSection({ saveToProfileRef }: ContactInfoSectionProps) {
  const { customerName, customerPhone, setCustomerName, setCustomerPhone } = useCheckoutStore();
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [profileHadData, setProfileHadData] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Sync saveToProfile to ref for parent access
  useEffect(() => {
    saveToProfileRef.current = saveToProfile;
  }, [saveToProfile, saveToProfileRef]);

  // Fetch profile on mount for auto-fill
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile");
      if (!res.ok) return;
      const { data } = await res.json();
      if (!data) return;

      const hasName = !!data.fullName;
      const hasPhone = !!data.phone;
      setProfileHadData(hasName && hasPhone);

      if (hasName && !customerName) {
        setCustomerName(data.fullName);
      }
      if (hasPhone && !customerPhone) {
        const digits = data.phone.replace(/\D/g, "");
        setCustomerPhone(digits);
        setPhoneDisplay(formatPhoneDisplay(digits));
      }
    } catch {
      // Non-fatal: user can still enter manually
    } finally {
      setProfileLoaded(true);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sync phoneDisplay from store on initial load if store already has value
  useEffect(() => {
    if (customerPhone && !phoneDisplay) {
      setPhoneDisplay(formatPhoneDisplay(customerPhone));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCustomerPhone(raw);
    setPhoneDisplay(formatPhoneDisplay(raw));
  };

  const phoneDigits = customerPhone.replace(/\D/g, "");
  const nameValid = customerName.trim().length >= 2;
  const phoneValid = phoneDigits.length >= 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h3 className="font-body text-sm font-medium text-text-primary">Contact Information</h3>
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="customerName" className="font-body text-sm text-text-primary">
            Full Name <span className="text-status-error">*</span>
          </Label>
          <Input
            id="customerName"
            type="text"
            placeholder="Your full name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            maxLength={100}
            className={!nameValid && customerName.length > 0 ? "border-status-error" : ""}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone" className="font-body text-sm text-text-primary">
            Phone Number <span className="text-status-error">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              id="customerPhone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              className={`pl-10 ${!phoneValid && phoneDigits.length > 0 ? "border-status-error" : ""}`}
            />
          </div>
          <p className="font-body text-xs text-text-muted">Used to coordinate your delivery</p>
        </div>

        {/* Save to profile nudge — only when profile is missing name or phone */}
        {profileLoaded && !profileHadData && (nameValid || phoneValid) && (
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
            <Checkbox
              id="saveToProfile"
              checked={saveToProfile}
              onCheckedChange={(checked) => setSaveToProfile(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="saveToProfile"
              className="font-body text-xs text-text-primary cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3 text-primary" />
                Save to profile for faster checkout next time
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
