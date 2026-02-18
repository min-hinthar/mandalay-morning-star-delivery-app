"use client";

import { m, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Address, AddressFormData, FormErrors } from "./types";

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAddress: Address | null;
  formData: AddressFormData;
  formErrors: FormErrors;
  isSaving: boolean;
  onInputChange: (field: keyof AddressFormData, value: string | boolean) => void;
  onSave: () => void;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  editingAddress,
  formData,
  formErrors,
  isSaving,
  onInputChange,
  onSave,
}: AddressFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingAddress ? "Edit Address" : "Add Address"}</DialogTitle>
          <DialogDescription>
            {editingAddress ? "Update your delivery address details" : "Add a new delivery address"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Label */}
          <div>
            <label
              htmlFor="addressLabel"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Label
            </label>
            <Input
              id="addressLabel"
              value={formData.label}
              onChange={(e) => onInputChange("label", e.target.value)}
              placeholder="e.g., Home, Work, Office"
              aria-invalid={!!formErrors.label}
              aria-describedby={formErrors.label ? "label-error" : undefined}
              className={formErrors.label ? "border-status-error focus:ring-status-error" : ""}
            />
            <AnimatePresence>
              {formErrors.label && (
                <m.p
                  id="label-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 text-sm text-status-error"
                >
                  {formErrors.label}
                </m.p>
              )}
            </AnimatePresence>
          </div>

          {/* Line 1 */}
          <div>
            <label
              htmlFor="addressLine1"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Address Line 1 <span className="text-status-error">*</span>
            </label>
            <Input
              id="addressLine1"
              value={formData.line1}
              onChange={(e) => onInputChange("line1", e.target.value)}
              placeholder="Street address"
              aria-invalid={!!formErrors.line1}
              aria-describedby={formErrors.line1 ? "line1-error" : undefined}
              className={formErrors.line1 ? "border-status-error focus:ring-status-error" : ""}
            />
            <AnimatePresence>
              {formErrors.line1 && (
                <m.p
                  id="line1-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 text-sm text-status-error"
                >
                  {formErrors.line1}
                </m.p>
              )}
            </AnimatePresence>
          </div>

          {/* Line 2 */}
          <div>
            <label
              htmlFor="addressLine2"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Address Line 2
            </label>
            <Input
              id="addressLine2"
              value={formData.line2}
              onChange={(e) => onInputChange("line2", e.target.value)}
              placeholder="Apt, suite, unit, etc. (optional)"
            />
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="addressCity"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              City <span className="text-status-error">*</span>
            </label>
            <Input
              id="addressCity"
              value={formData.city}
              onChange={(e) => onInputChange("city", e.target.value)}
              placeholder="City"
              aria-invalid={!!formErrors.city}
              aria-describedby={formErrors.city ? "city-error" : undefined}
              className={formErrors.city ? "border-status-error focus:ring-status-error" : ""}
            />
            <AnimatePresence>
              {formErrors.city && (
                <m.p
                  id="city-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 text-sm text-status-error"
                >
                  {formErrors.city}
                </m.p>
              )}
            </AnimatePresence>
          </div>

          {/* State and Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="addressState"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                State <span className="text-status-error">*</span>
              </label>
              <Input
                id="addressState"
                value={formData.state}
                onChange={(e) => onInputChange("state", e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                aria-invalid={!!formErrors.state}
                aria-describedby={formErrors.state ? "state-error" : undefined}
                className={formErrors.state ? "border-status-error focus:ring-status-error" : ""}
              />
              <AnimatePresence>
                {formErrors.state && (
                  <m.p
                    id="state-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {formErrors.state}
                  </m.p>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label
                htmlFor="addressPostalCode"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Postal Code <span className="text-status-error">*</span>
              </label>
              <Input
                id="addressPostalCode"
                value={formData.postalCode}
                onChange={(e) => onInputChange("postalCode", e.target.value)}
                placeholder="12345"
                aria-invalid={!!formErrors.postalCode}
                aria-describedby={formErrors.postalCode ? "postalCode-error" : undefined}
                className={
                  formErrors.postalCode ? "border-status-error focus:ring-status-error" : ""
                }
              />
              <AnimatePresence>
                {formErrors.postalCode && (
                  <m.p
                    id="postalCode-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {formErrors.postalCode}
                  </m.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Set as Default */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => onInputChange("isDefault", e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-text-primary">
              Set as default address
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} disabled={isSaving} isLoading={isSaving}>
            {editingAddress ? "Save Changes" : "Add Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
