"use client";

/**
 * AddressStepV8 - Address selection step with animations
 *
 * Enhanced version with:
 * - Staggered address card animations
 * - Skeleton loading state
 * - Responsive overlays (Modal on desktop, BottomSheet on mobile)
 * - Edit/delete functionality
 *
 * Phase 6 Plan 03
 */

import { useState } from "react";
import { m } from "framer-motion";
import { MapPin, Plus } from "lucide-react";
import { logger } from "@/lib/utils/logger";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/lib/hooks/useAddresses";
import { useCheckoutStore, useCanProceed } from "@/lib/stores/checkout-store";
import { useMediaQuery } from "@/lib/hooks";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { AddressCardV8 } from "./AddressCardV8";
import { AddressFormV8 } from "./AddressFormV8";
import { CoverageErrorCard } from "./CoverageErrorCard";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem, spring } from "@/lib/motion-tokens";
import type { Address } from "@/types/address";
import type { DeliveryZoneConfig } from "@/types/delivery";
import type { AddressFormValues } from "@/lib/validations/address";

/** Button entry animation variant */
const buttonEntry = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 },
  },
};

type FormMode = "add" | "edit";

interface AddressStepV8Props {
  onNext?: () => void;
  deliveryZones?: DeliveryZoneConfig[];
}

interface StructuredFormError {
  message: string;
  code?: string;
  details?: unknown;
}

export function AddressStepV8({ onNext, deliveryZones }: AddressStepV8Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formError, setFormError] = useState<StructuredFormError | undefined>();

  const { data, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const { address, setAddress, nextStep: storeNextStep } = useCheckoutStore();
  const canProceed = useCanProceed();
  const handleNext = onNext || storeNextStep;
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // 639px breakpoint for exact 640px desktop threshold (per project decision)
  const isMobile = useMediaQuery("(max-width: 639px)");

  const addresses = data?.data ?? [];

  const handleSelectAddress = (addr: Address) => {
    setAddress(addr);
  };

  const openAddModal = () => {
    setFormMode("add");
    setEditingAddress(null);
    setFormError(undefined);
    setIsFormOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setFormMode("edit");
    setEditingAddress(addr);
    setFormError(undefined);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    setFormError(undefined);
  };

  const handleSubmit = async (formData: AddressFormValues) => {
    setFormError(undefined);
    try {
      if (formMode === "edit" && editingAddress) {
        const result = await updateAddress.mutateAsync({
          id: editingAddress.id,
          data: formData,
        });
        // Update selected address if it was the one being edited
        if (address?.id === editingAddress.id) {
          setAddress(result.data);
        }
      } else {
        const result = await createAddress.mutateAsync(formData);
        setAddress(result.data);
      }
      closeForm();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string; code?: string; details?: unknown } };
      setFormError({
        message: err?.error?.message ?? "Failed to save address",
        code: err?.error?.code,
        details: err?.error?.details,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      // Note: If deleted address was selected, user must select another
      // The address list will refresh via query invalidation
    } catch {
      logger.error("Failed to delete address", { api: "addresses" });
    }
  };

  const isSaving = createAddress.isPending || updateAddress.isPending;

  const formTitle = formMode === "edit" ? "Edit Address" : "Add Address";

  const FormContent = (
    <AddressFormV8
      defaultValues={
        editingAddress
          ? {
              label: editingAddress.label,
              line1: editingAddress.line1,
              line2: editingAddress.line2 ?? "",
              city: editingAddress.city,
              state: editingAddress.state,
              postalCode: editingAddress.postalCode,
            }
          : undefined
      }
      onSubmit={handleSubmit}
      onCancel={closeForm}
      isLoading={isSaving}
      error={formError?.message}
    />
  );

  return (
    <m.div
      className="space-y-6"
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
    >
      {/* Header with stagger */}
      <m.div variants={shouldAnimate ? staggerItem : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-text-primary">Delivery Address</h2>
        </div>
        <p className="font-body text-sm text-text-muted">Select or add a delivery address</p>
      </m.div>

      {/* Skeleton loading state */}
      {isLoading && (
        <m.div variants={shouldAnimate ? staggerItem : undefined} className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-4 rounded-xl border border-border">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </m.div>
      )}

      {/* Address cards with stagger animation */}
      {!isLoading && addresses.length > 0 && (
        <m.div variants={shouldAnimate ? staggerItem : undefined} className="space-y-3">
          {addresses.map((addr, idx) => (
            <m.div
              key={addr.id}
              initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: idx * 0.08, ...getSpring(spring.default) }}
            >
              <AddressCardV8
                address={addr}
                isSelected={address?.id === addr.id}
                onSelect={() => handleSelectAddress(addr)}
                onEdit={() => openEditModal(addr)}
                onDelete={() => handleDelete(addr.id)}
                deliveryZones={deliveryZones}
              />
            </m.div>
          ))}
        </m.div>
      )}

      {/* Empty state */}
      {!isLoading && addresses.length === 0 && (
        <m.div
          variants={shouldAnimate ? staggerItem : undefined}
          className="text-center py-8 px-4 rounded-xl border border-dashed border-border"
        >
          <MapPin className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No saved addresses yet</p>
        </m.div>
      )}

      {/* Add new address button with scale entry */}
      <m.div variants={shouldAnimate ? buttonEntry : undefined}>
        <Button variant="outline" onClick={openAddModal} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      </m.div>

      {/* Coverage error from form submission */}
      {formError?.code === "OUT_OF_COVERAGE" && !isFormOpen && (
        <m.div variants={shouldAnimate ? staggerItem : undefined}>
          <CoverageErrorCard coverage={(formError.details as Record<string, unknown>) ?? {}} />
        </m.div>
      )}

      {formError?.code === "GEOCODE_FAILED" && !isFormOpen && (
        <m.div variants={shouldAnimate ? staggerItem : undefined}>
          <div className="rounded-xl border border-status-error/20 bg-status-error-bg p-4">
            <p className="text-sm text-status-error">
              We couldn&apos;t find this address. Please check the street address and try again.
            </p>
          </div>
        </m.div>
      )}

      {/* Continue button with scale entry */}
      <m.div
        variants={shouldAnimate ? buttonEntry : undefined}
        className="flex justify-center pt-4 border-t border-border"
      >
        <Button variant="default" onClick={handleNext} disabled={!canProceed} size="lg">
          Continue to Time Selection
        </Button>
      </m.div>

      {/* Responsive overlay for add/edit */}
      {isMobile ? (
        <Drawer isOpen={isFormOpen} onClose={closeForm} position="bottom" title={formTitle}>
          <div className="px-4 pb-4">
            <h3 className="font-semibold text-lg mb-4">{formTitle}</h3>
            {FormContent}
          </div>
        </Drawer>
      ) : (
        <Modal isOpen={isFormOpen} onClose={closeForm} title={formTitle}>
          {FormContent}
        </Modal>
      )}
    </m.div>
  );
}
