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
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-cream to-lotus/20 border-curry/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-charcoal">
            <div className="p-2 rounded-lg bg-gradient-to-br from-saffron to-curry text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            Add New Driver
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new driver to your delivery fleet. They&apos;ll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* General Error */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-charcoal"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="driver@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={cn(
                "bg-white border-curry/20 focus:border-saffron focus:ring-saffron/20",
                errors.email && "border-red-400 focus:border-red-400 focus:ring-red-200"
              )}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-charcoal"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={cn(
                "bg-white border-curry/20 focus:border-saffron focus:ring-saffron/20",
                errors.fullName && "border-red-400 focus:border-red-400 focus:ring-red-200"
              )}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-charcoal"
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
                "bg-white border-curry/20 focus:border-saffron focus:ring-saffron/20",
                errors.phone && "border-red-400 focus:border-red-400 focus:ring-red-200"
              )}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">
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
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    formData.vehicleType === option.value
                      ? "border-saffron bg-saffron/10 text-saffron"
                      : "border-curry/10 bg-white hover:border-saffron/50 text-muted-foreground hover:text-charcoal"
                  )}
                  disabled={isSubmitting}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
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
                className="text-sm font-medium text-charcoal"
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
                  "bg-white border-curry/20 focus:border-saffron focus:ring-saffron/20 font-mono uppercase",
                  errors.licensePlate && "border-red-400 focus:border-red-400 focus:ring-red-200"
                )}
                disabled={isSubmitting}
              />
              {errors.licensePlate && (
                <p className="text-xs text-red-500 mt-1">{errors.licensePlate}</p>
              )}
            </motion.div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-curry/20 hover:bg-curry/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-saffron to-curry hover:from-saffron-dark hover:to-curry-dark text-white shadow-md"
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
