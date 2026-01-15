"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useAddresses, useCreateAddress } from "@/lib/hooks/useAddresses";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { AddressForm } from "./AddressForm";
import { AddressCard } from "./AddressCard";
import { Button } from "@/components/ui/button";
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Delivery Address</h2>
        <p className="text-sm text-muted-foreground">
          Select or add a delivery address
        </p>
      </div>

      {addresses.length > 0 && !showForm && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              isSelected={address?.id === addr.id}
              onSelect={() => handleSelectAddress(addr)}
            />
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-4 font-medium text-foreground">Add New Address</h3>
          <AddressForm
            onSubmit={handleCreateAddress}
            onCancel={() => {
              setShowForm(false);
              setFormError(undefined);
            }}
            isLoading={createAddress.isPending}
            error={formError}
          />
        </div>
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

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="bg-brand-red hover:bg-brand-red/90"
        >
          Continue to Time Selection
        </Button>
      </div>
    </div>
  );
}
