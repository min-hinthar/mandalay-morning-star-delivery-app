"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

// Phase 111 CHKP-01 D-06 — Zod schema mirrors the previous nameValid/phoneValid
// checks. Used by react-hook-form via zodResolver to drive inline validation
// in onTouched mode. Schema validates the RAW digits for phone (not display).
const contactInfoSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  customerPhone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
});

type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

interface ContactInfoSectionProps {
  /** Called after successful checkout if saveToProfile is checked */
  saveToProfileRef: React.MutableRefObject<boolean>;
}

export function ContactInfoSection({ saveToProfileRef }: ContactInfoSectionProps) {
  const { customerName, customerPhone, setCustomerName, setCustomerPhone } = useCheckoutStore();
  const [profileHadData, setProfileHadData] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Phase 111 CHKP-01 D-06 — Full react-hook-form migration. Per D-06 verbatim:
  // "If plain controlled inputs, wire them to RHF for consistency. Read the
  // file during planning to confirm; do NOT half-migrate." This is the FULL
  // migration: useForm + Controller + zodResolver + mode: onTouched. Bidirectional
  // sync to useCheckoutStore via watch() + reset().
  const {
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm<ContactInfoFormValues>({
    mode: "onTouched",
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      customerName: customerName ?? "",
      customerPhone: customerPhone ?? "",
    },
  });

  // Watch RHF values and sync DOWN to useCheckoutStore on change.
  // This is the canonical RHF -> external store bridge.
  const watchedName = watch("customerName");
  const watchedPhone = watch("customerPhone");

  useEffect(() => {
    if (watchedName !== customerName) {
      setCustomerName(watchedName ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName]);

  useEffect(() => {
    if (watchedPhone !== customerPhone) {
      setCustomerPhone(watchedPhone ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPhone]);

  // Sync saveToProfile to ref for parent access
  useEffect(() => {
    saveToProfileRef.current = saveToProfile;
  }, [saveToProfile, saveToProfileRef]);

  // Fetch profile on mount for auto-fill — pushes UP into RHF via reset()
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile");
      if (!res.ok) return;
      const { data } = await res.json();
      if (!data) return;

      const hasName = !!data.fullName;
      const hasPhone = !!data.phone;
      setProfileHadData(hasName && hasPhone);

      // Only seed RHF if the form fields are still empty (do not clobber typing)
      const currentValues = {
        customerName: watch("customerName"),
        customerPhone: watch("customerPhone"),
      };
      const nextValues = { ...currentValues };
      if (hasName && !currentValues.customerName) {
        nextValues.customerName = data.fullName;
      }
      if (hasPhone && !currentValues.customerPhone) {
        nextValues.customerPhone = data.phone.replace(/\D/g, "");
      }
      reset(nextValues, { keepDirty: false, keepTouched: false });
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

  // Derived "is form satisfied" booleans for the save-to-profile nudge.
  // Use the schema directly so the nudge logic stays in lock-step with RHF.
  const nameValid = !errors.customerName && (watchedName?.trim().length ?? 0) >= 2;
  const phoneDigits = (watchedPhone ?? "").replace(/\D/g, "");
  const phoneValid = !errors.customerPhone && phoneDigits.length >= 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h3 className="font-body text-sm font-medium text-text-primary">Contact Information</h3>
      </div>

      <div className="space-y-3">
        {/* Name — RHF Controller */}
        <div className="space-y-1.5">
          <Label htmlFor="customerName" className="font-body text-sm text-text-primary">
            Full Name <span className="text-status-error">*</span>
          </Label>
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <Input
                id="customerName"
                type="text"
                placeholder="Your full name"
                maxLength={100}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={errors.customerName ? true : undefined}
                aria-describedby={errors.customerName ? "customerName-error" : undefined}
                className={errors.customerName ? "border-status-error" : ""}
              />
            )}
          />
          {errors.customerName && (
            <p id="customerName-error" role="alert" className="font-body text-xs text-status-error">
              {errors.customerName.message}
            </p>
          )}
        </div>

        {/* Phone — RHF Controller, raw digits in form state, formatted display in input */}
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone" className="font-body text-sm text-text-primary">
            Phone Number <span className="text-status-error">*</span>
          </Label>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formatPhoneDisplay(field.value ?? "")}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                    field.onChange(raw);
                  }}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  aria-invalid={errors.customerPhone ? true : undefined}
                  aria-describedby={errors.customerPhone ? "customerPhone-error" : undefined}
                  className={`pl-10 ${errors.customerPhone ? "border-status-error" : ""}`}
                />
              </div>
            )}
          />
          {errors.customerPhone && (
            <p
              id="customerPhone-error"
              role="alert"
              className="font-body text-xs text-status-error"
            >
              {errors.customerPhone.message}
            </p>
          )}
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
