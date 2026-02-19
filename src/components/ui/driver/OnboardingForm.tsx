"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const vehicleTypes = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
] as const;

type VehicleType = (typeof vehicleTypes)[number]["value"];

const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .regex(/^[\d\s\-+()]+$/, "Phone number can only contain digits, spaces, and + - ( )"),
  vehicleType: z.enum(["car", "motorcycle", "bicycle", "van", "truck"], {
    message: "Please select a vehicle type",
  }),
  licensePlate: z
    .string()
    .min(2, "Please enter a valid license plate")
    .regex(
      /^[A-Z0-9\s\-]+$/i,
      "License plate can only contain letters, numbers, spaces, and hyphens"
    ),
});

type FormData = z.infer<typeof onboardingSchema>;
type FieldErrors = Partial<Record<keyof FormData, string>>;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface OnboardingFormProps {
  email: string;
  inviteId: string;
  invitedBy?: string;
  inviteDate?: string;
  expiryDate?: string;
  inviteEmail?: string;
}

export function OnboardingForm({
  email: _email,
  inviteId,
  invitedBy,
  inviteDate,
  expiryDate,
  inviteEmail,
}: OnboardingFormProps): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    vehicleType: "" as VehicleType | "",
    licensePlate: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Validate form data
    const result = onboardingSchema.safeParse(formData);

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
      const response = await fetch("/api/driver/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteId,
          fullName: result.data.fullName,
          phone: result.data.phone,
          vehicleType: result.data.vehicleType,
          licensePlate: result.data.licensePlate.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Registration failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Redirect to driver dashboard on success
      router.push(data.redirectUrl || "/driver");
      router.refresh();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  const hasInviteMetadata = invitedBy || inviteDate || expiryDate || inviteEmail;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{formError}</div>
      )}

      {hasInviteMetadata && (
        <div className="bg-surface-secondary rounded-lg p-3 space-y-1">
          {invitedBy && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Invited by:</span> {invitedBy}
            </p>
          )}
          {inviteDate && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Invited:</span> {formatDate(inviteDate)}
            </p>
          )}
          {expiryDate && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Expires:</span> {formatDate(expiryDate)}
            </p>
          )}
          {inviteEmail && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Email:</span> {inviteEmail}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          error={fieldErrors.fullName}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone Number
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          error={fieldErrors.phone}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="vehicleType" className="text-sm font-medium">
          Vehicle Type
        </label>
        <Select
          value={formData.vehicleType}
          onValueChange={(value) => handleChange("vehicleType", value as VehicleType)}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="vehicleType"
            className={fieldErrors.vehicleType ? "border-status-error" : ""}
          >
            <SelectValue placeholder="Select your vehicle type" />
          </SelectTrigger>
          <SelectContent>
            {vehicleTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.vehicleType && (
          <p className="mt-1.5 text-sm text-status-error flex items-center gap-1">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {fieldErrors.vehicleType}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="licensePlate" className="text-sm font-medium">
          License Plate
        </label>
        <Input
          id="licensePlate"
          name="licensePlate"
          type="text"
          placeholder="ABC 1234"
          value={formData.licensePlate}
          onChange={(e) => handleChange("licensePlate", e.target.value.toUpperCase())}
          error={fieldErrors.licensePlate}
          disabled={isSubmitting}
          required
          className="uppercase"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        variant="primary"
        isLoading={isSubmitting}
        loadingText="Creating account..."
      >
        Complete Registration
      </Button>
    </form>
  );
}
