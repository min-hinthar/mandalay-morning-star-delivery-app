"use client";

import { m } from "framer-motion";
import { User, Phone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { SaveButton } from "@/components/ui/admin/settings/SaveButton";
import type { VehicleType } from "@/types/driver";
import type { EditFormState } from "./types";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  editForm: EditFormState;
  onFormChange: (updater: (prev: EditFormState) => EditFormState) => void;
  onSave: () => void;
  saving: boolean;
}

export function EditProfileModal({
  open,
  onClose,
  editForm,
  onFormChange,
  onSave,
  saving,
}: EditProfileModalProps) {
  if (!open) return null;

  const handleSave = async () => {
    onSave();
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-surface-inverse/60"
        onClick={onClose}
      />
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring.default}
        className="relative bg-surface-primary rounded-card-sm border border-border p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="text-xl font-display font-semibold text-text-primary mb-6">Edit Driver Profile</h2>

        <div className="space-y-4">
          <FloatingLabelInput
            label="Full Name"
            icon={User}
            value={editForm.fullName}
            onChange={(e) => onFormChange((prev) => ({ ...prev, fullName: e.target.value }))}
          />

          <FloatingLabelInput
            label="Phone"
            icon={Phone}
            type="tel"
            value={editForm.phone}
            onChange={(e) => onFormChange((prev) => ({ ...prev, phone: e.target.value }))}
          />

          <div>
            <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
              Vehicle Type
            </label>
            <select
              value={editForm.vehicleType}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, vehicleType: e.target.value as VehicleType | "" }))
              }
              className={cn(
                "w-full px-3 py-2 rounded-input",
                "bg-surface-secondary border border-border",
                "font-body text-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-accent-teal/20 focus:border-accent-teal"
              )}
            >
              <option value="">Select vehicle type</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bicycle">Bicycle</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
            </select>
          </div>

          <FloatingLabelInput
            label="License Plate"
            icon={CreditCard}
            value={editForm.licensePlate}
            onChange={(e) => onFormChange((prev) => ({ ...prev, licensePlate: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SaveButton
            onClick={handleSave}
            disabled={saving}
            hasChanges={true}
          />
        </div>
      </m.div>
    </div>
  );
}
