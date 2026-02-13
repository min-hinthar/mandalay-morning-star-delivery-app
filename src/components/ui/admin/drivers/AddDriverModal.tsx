/**
 * V8 Add Driver Modal - Floating Labels + SaveButton
 *
 * Modal form for adding new drivers with floating label inputs,
 * shake validation, vehicle type selector, and SaveButton.
 */

"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { UserPlus, Car, Bike, Truck, AlertCircle, Mail, User, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { SaveButton } from "@/components/ui/admin/settings/SaveButton";
import { cn } from "@/lib/utils/cn";
import type { VehicleType } from "@/types/driver";

interface AddDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDriverData) => Promise<void>;
}

export interface CreateDriverData {
  email: string;
  fullName: string;
  phone?: string;
  vehicleType?: VehicleType;
  licensePlate?: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
  phone?: string;
  vehicleType?: string;
  licensePlate?: string;
  general?: string;
}

const VEHICLE_OPTIONS: { value: VehicleType; label: string; icon: React.ReactNode }[] = [
  { value: "car", label: "Car", icon: <Car className="h-5 w-5" /> },
  { value: "motorcycle", label: "Motorcycle", icon: <Bike className="h-5 w-5" /> },
  { value: "bicycle", label: "Bicycle", icon: <Bike className="h-5 w-5" /> },
  { value: "van", label: "Van", icon: <Truck className="h-5 w-5" /> },
  { value: "truck", label: "Truck", icon: <Truck className="h-5 w-5" /> },
];

export function AddDriverModal({ open, onOpenChange, onSubmit }: AddDriverModalProps) {
  const [formData, setFormData] = useState<CreateDriverData>({
    email: "",
    fullName: "",
    phone: "",
    vehicleType: undefined,
    licensePlate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof CreateDriverData, value: string | VehicleType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name is required (min 2 characters)";
    }

    if (formData.phone && !/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format";
    }

    if (formData.vehicleType && formData.licensePlate) {
      if (formData.licensePlate.length < 2) {
        newErrors.licensePlate = "License plate must be at least 2 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!validateForm()) return false;

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData: CreateDriverData = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
      };

      if (formData.phone?.trim()) {
        submitData.phone = formData.phone.trim();
      }
      if (formData.vehicleType) {
        submitData.vehicleType = formData.vehicleType;
      }
      if (formData.licensePlate?.trim()) {
        submitData.licensePlate = formData.licensePlate.trim();
      }

      await onSubmit(submitData);

      // Reset form on success
      setFormData({
        email: "",
        fullName: "",
        phone: "",
        vehicleType: undefined,
        licensePlate: "",
      });
      onOpenChange(false);
      return true;
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Failed to create driver",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        email: "",
        fullName: "",
        phone: "",
        vehicleType: undefined,
        licensePlate: "",
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-surface-primary border-border rounded-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-input bg-accent-teal text-text-inverse">
              <UserPlus className="h-5 w-5" />
            </div>
            Add New Driver
          </DialogTitle>
          <DialogDescription className="font-body text-text-secondary">
            Add a new driver to your delivery fleet. They&apos;ll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-5 mt-4">
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

          {/* Email */}
          <FloatingLabelInput
            label="Email Address *"
            icon={Mail}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            disabled={isSubmitting}
          />

          {/* Full Name */}
          <FloatingLabelInput
            label="Full Name *"
            icon={User}
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            error={errors.fullName}
            disabled={isSubmitting}
          />

          {/* Phone */}
          <FloatingLabelInput
            label="Phone Number"
            icon={Phone}
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={errors.phone}
            disabled={isSubmitting}
          />

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-text-primary">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {VEHICLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handleChange(
                      "vehicleType",
                      formData.vehicleType === option.value ? undefined as unknown as VehicleType : option.value
                    )
                  }
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-card-sm border-2 transition-all duration-fast",
                    formData.vehicleType === option.value
                      ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                      : "border-border bg-surface-primary hover:border-accent-teal/50 text-text-secondary hover:text-text-primary"
                  )}
                  disabled={isSubmitting}
                >
                  {option.icon}
                  <span className="text-xs font-body font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* License Plate (shown when vehicle is selected) */}
          {formData.vehicleType && formData.vehicleType !== "bicycle" && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FloatingLabelInput
                label="License Plate"
                icon={Truck}
                value={formData.licensePlate}
                onChange={(e) => handleChange("licensePlate", e.target.value.toUpperCase())}
                error={errors.licensePlate}
                disabled={isSubmitting}
                className="font-mono uppercase"
              />
            </m.div>
          )}

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
            <SaveButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              hasChanges={Boolean(formData.email && formData.fullName)}
              className="min-w-[140px]"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
