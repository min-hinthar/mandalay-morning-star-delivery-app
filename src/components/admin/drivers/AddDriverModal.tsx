/**
 * V6 Add Driver Modal - Pepper Aesthetic
 *
 * Modal form for adding new drivers with V6 colors, typography, and animations.
 * Features vehicle type selector and animated form validation.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserPlus, Car, Bike, Truck, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

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
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Failed to create driver",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <DialogContent className="sm:max-w-[500px] bg-v6-surface-primary border-v6-border rounded-v6-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-v6-display text-2xl text-v6-text-primary">
            <div className="p-2 rounded-v6-input bg-v6-primary text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            Add New Driver
          </DialogTitle>
          <DialogDescription className="font-v6-body text-v6-text-secondary">
            Add a new driver to your delivery fleet. They&apos;ll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* General Error */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-v6-input bg-v6-status-error/10 border border-v6-status-error/20 text-v6-status-error text-sm font-v6-body"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-v6-body font-medium text-v6-text-primary"
            >
              Email Address <span className="text-v6-status-error">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="driver@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={cn(
                "bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input",
                errors.email && "border-v6-status-error focus:border-v6-status-error focus:ring-v6-status-error/20"
              )}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs font-v6-body text-v6-status-error mt-1">{errors.email}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-sm font-v6-body font-medium text-v6-text-primary"
            >
              Full Name <span className="text-v6-status-error">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={cn(
                "bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input",
                errors.fullName && "border-v6-status-error focus:border-v6-status-error focus:ring-v6-status-error/20"
              )}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="text-xs font-v6-body text-v6-status-error mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-v6-body font-medium text-v6-text-primary"
            >
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={cn(
                "bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input",
                errors.phone && "border-v6-status-error focus:border-v6-status-error focus:ring-v6-status-error/20"
              )}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs font-v6-body text-v6-status-error mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="text-sm font-v6-body font-medium text-v6-text-primary">
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
                    "flex flex-col items-center gap-1.5 p-3 rounded-v6-card-sm border-2 transition-all duration-v6-fast",
                    formData.vehicleType === option.value
                      ? "border-v6-primary bg-v6-primary-light text-v6-primary"
                      : "border-v6-border bg-v6-surface-primary hover:border-v6-primary/50 text-v6-text-secondary hover:text-v6-text-primary"
                  )}
                  disabled={isSubmitting}
                >
                  {option.icon}
                  <span className="text-xs font-v6-body font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* License Plate (shown when vehicle is selected) */}
          {formData.vehicleType && formData.vehicleType !== "bicycle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label
                htmlFor="licensePlate"
                className="text-sm font-v6-body font-medium text-v6-text-primary"
              >
                License Plate
              </label>
              <Input
                id="licensePlate"
                type="text"
                placeholder="ABC 1234"
                value={formData.licensePlate}
                onChange={(e) => handleChange("licensePlate", e.target.value.toUpperCase())}
                className={cn(
                  "bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input font-mono uppercase",
                  errors.licensePlate && "border-v6-status-error focus:border-v6-status-error focus:ring-v6-status-error/20"
                )}
                disabled={isSubmitting}
              />
              {errors.licensePlate && (
                <p className="text-xs font-v6-body text-v6-status-error mt-1">{errors.licensePlate}</p>
              )}
            </motion.div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-v6-border hover:bg-v6-surface-tertiary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-v6-primary hover:bg-v6-primary-hover text-white shadow-v6-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Driver
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
