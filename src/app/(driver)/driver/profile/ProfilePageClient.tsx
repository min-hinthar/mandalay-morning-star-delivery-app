/**
 * ProfilePageClient - Driver profile form with photo upload
 *
 * Editable fields: name, phone, vehicle type, license plate
 * Read-only: email, status badge, member since
 * Features: unsaved changes warning, inline validation, toast feedback
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { m } from "framer-motion";
import { Mail, Lock, Shield, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { driverSelfUpdateSchema } from "@/lib/validations/driver";
import { toast } from "@/lib/hooks/useToastV8";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/ui/driver/AvatarUpload";
import { SimpleModeToggle } from "@/components/ui/driver/SimpleModeToggle";
import type { VehicleType } from "@/types/driver";

const vehicleOptions = [
  { value: "motorcycle", label: "Motorcycle" },
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
] as const;

type FormData = {
  fullName: string;
  phone: string;
  vehicleType: string;
  licensePlate: string;
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface ProfilePageClientProps {
  driverId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  licensePlate: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export function ProfilePageClient({
  driverId,
  fullName: initialFullName,
  email,
  phone: initialPhone,
  vehicleType: initialVehicleType,
  licensePlate: initialLicensePlate,
  profileImageUrl: initialImageUrl,
  isActive,
  createdAt,
}: ProfilePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const highlightField = searchParams.get("highlight");

  const [formData, setFormData] = useState<FormData>({
    fullName: initialFullName ?? "",
    phone: initialPhone ?? "",
    vehicleType: initialVehicleType ?? "",
    licensePlate: initialLicensePlate ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);

  // Track initial values for dirty detection
  const initialValues = useMemo(
    () => ({
      fullName: initialFullName ?? "",
      phone: initialPhone ?? "",
      vehicleType: initialVehicleType ?? "",
      licensePlate: initialLicensePlate ?? "",
    }),
    [initialFullName, initialPhone, initialVehicleType, initialLicensePlate]
  );

  const hasUnsavedChanges = useMemo(
    () =>
      formData.fullName !== initialValues.fullName ||
      formData.phone !== initialValues.phone ||
      formData.vehicleType !== initialValues.vehicleType ||
      formData.licensePlate !== initialValues.licensePlate,
    [formData, initialValues]
  );

  // Unsaved changes warning
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Scroll to highlighted field
  useEffect(() => {
    if (!highlightField) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`field-${highlightField}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-accent-teal", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-accent-teal", "ring-offset-2");
        }, 2000);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightField]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [fieldErrors]
  );

  const handlePhotoUpdated = useCallback(
    (url: string | null) => {
      setCurrentImageUrl(url);
      router.refresh();
    },
    [router]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFieldErrors({});

      // Build update payload (only changed fields)
      const payload: Record<string, unknown> = {};
      if (formData.fullName !== initialValues.fullName) payload.fullName = formData.fullName;
      if (formData.phone !== initialValues.phone) payload.phone = formData.phone;
      if (formData.vehicleType !== initialValues.vehicleType)
        payload.vehicleType = formData.vehicleType || null;
      if (formData.licensePlate !== initialValues.licensePlate)
        payload.licensePlate = formData.licensePlate || null;

      if (Object.keys(payload).length === 0) {
        toast({ message: "No fields have been modified.", type: "info" });
        return;
      }

      // Validate
      const result = driverSelfUpdateSchema.safeParse(payload);
      if (!result.success) {
        const errors: FieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof FormData;
          if (!errors[field]) {
            errors[field] = issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/driver/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          toast({
            message: data.error || "Could not update profile. Try again.",
            type: "error",
          });
          return;
        }

        toast({ message: "Your changes have been saved.", type: "success" });
        router.refresh();
      } catch {
        toast({
          message: "An unexpected error occurred. Try again.",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, initialValues, router]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-primary to-surface-tertiary/30">
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Avatar Upload */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={getSpring(spring.default)}
        >
          <AvatarUpload
            currentImageUrl={currentImageUrl}
            driverName={formData.fullName || initialFullName}
            driverId={driverId}
            onPhotoUpdated={handlePhotoUpdated}
          />
        </m.div>

        {/* Profile Card */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.1 }}
          className={cn(
            "rounded-2xl border border-border shadow-card p-5 space-y-5",
            "bg-surface-primary/80 backdrop-blur-sm"
          )}
        >
          {/* Read-only info */}
          <div className="space-y-3">
            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                <Mail className="h-3.5 w-3.5" />
                Email
                <Lock className="h-3 w-3 text-text-muted" />
              </label>
              <Input
                value={email ?? ""}
                disabled
                className="bg-surface-secondary text-text-muted"
              />
            </div>

            {/* Status badge + Member since */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-text-muted" />
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}
                >
                  {isActive ? "Active" : "Deactivated"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar className="h-3.5 w-3.5" />
                Member since {formatDate(createdAt)}
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Editable fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div id="field-fullName" className="space-y-1.5 transition-all rounded-lg p-0.5">
              <label htmlFor="fullName" className="text-sm font-medium text-text-primary">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                error={fieldErrors.fullName}
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div id="field-phone" className="space-y-1.5 transition-all rounded-lg p-0.5">
              <label htmlFor="phone" className="text-sm font-medium text-text-primary">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Your phone number"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                error={fieldErrors.phone}
                disabled={isSubmitting}
              />
            </div>

            {/* Vehicle Type */}
            <div id="field-vehicleType" className="space-y-1.5 transition-all rounded-lg p-0.5">
              <label htmlFor="vehicleType" className="text-sm font-medium text-text-primary">
                Vehicle Type
              </label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value) => handleChange("vehicleType", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="vehicleType"
                  className={fieldErrors.vehicleType ? "border-status-error" : ""}
                >
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.vehicleType && (
                <p className="mt-1 text-sm text-status-error">{fieldErrors.vehicleType}</p>
              )}
            </div>

            {/* License Plate */}
            <div id="field-licensePlate" className="space-y-1.5 transition-all rounded-lg p-0.5">
              <label htmlFor="licensePlate" className="text-sm font-medium text-text-primary">
                License Plate
              </label>
              <Input
                id="licensePlate"
                type="text"
                placeholder="Your license plate"
                value={formData.licensePlate}
                onChange={(e) => handleChange("licensePlate", e.target.value)}
                error={fieldErrors.licensePlate}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </m.div>

        {/* Save Button */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.2 }}
        >
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!hasUnsavedChanges || isSubmitting}
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </m.div>
      </form>

      {/* Simple Mode Toggle */}
      <div className="px-4 pb-6">
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...getSpring(spring.default), delay: 0.3 }}
        >
          <SimpleModeToggle />
        </m.div>
      </div>
    </div>
  );
}
