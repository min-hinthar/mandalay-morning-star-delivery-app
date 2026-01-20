/**
 * V6 Address Step - Pepper Aesthetic
 *
 * Checkout step for selecting/adding delivery address.
 * V6 colors, typography, and micro-interactions.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, MapPin } from "lucide-react";
import { useAddresses, useCreateAddress } from "@/lib/hooks/useAddresses";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { AddressForm } from "./AddressForm";
import { AddressCard } from "./AddressCard";
import { Button } from "@/components/ui/button";
import { v6StaggerContainer, v6StaggerItem } from "@/lib/motion";
import type { Address } from "@/types/address";
import type { AddressFormValues } from "@/lib/validations/address";

export function AddressStep() {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const { data, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const { address, setAddress, nextStep, canProceed } = useCheckoutStore();

  const addresses = data?.data ?? [];

  const handleSelectAddress = (addr: Address) => {
    setAddress(addr);
  };

  const handleCreateAddress = async (formData: AddressFormValues) => {
    setFormError(undefined);
    try {
      const result = await createAddress.mutateAsync(formData);
      setAddress(result.data);
      setShowForm(false);
    } catch (error: unknown) {
      const err = error as { error?: { message?: string } };
      setFormError(err?.error?.message ?? "Failed to add address");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-v6-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* V6 Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-v6-primary" />
          <h2 className="font-v6-display text-lg font-semibold text-v6-text-primary">
            Delivery Address
          </h2>
        </div>
        <p className="font-v6-body text-sm text-v6-text-secondary">
          Select or add a delivery address
        </p>
      </div>

      {/* V6 Address Cards with Stagger Animation */}
      {addresses.length > 0 && !showForm && (
        <motion.div
          variants={v6StaggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {addresses.map((addr) => (
            <motion.div key={addr.id} variants={v6StaggerItem}>
              <AddressCard
                address={addr}
                isSelected={address?.id === addr.id}
                onSelect={() => handleSelectAddress(addr)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* V6 Add Address Form */}
      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-v6-card border border-v6-border bg-v6-surface-primary p-5 shadow-v6-sm"
        >
          <h3 className="mb-4 font-v6-display font-semibold text-v6-text-primary">
            Add New Address
          </h3>
          <AddressForm
            onSubmit={handleCreateAddress}
            onCancel={() => {
              setShowForm(false);
              setFormError(undefined);
            }}
            isLoading={createAddress.isPending}
            error={formError}
          />
        </motion.div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      )}

      {/* V6 Continue Button */}
      <div className="flex justify-center pt-4 border-t border-v6-border">
        <Button
          variant="primary"
          onClick={nextStep}
          disabled={!canProceed()}
          size="lg"
        >
          Continue to Time Selection
        </Button>
      </div>
    </div>
  );
}
