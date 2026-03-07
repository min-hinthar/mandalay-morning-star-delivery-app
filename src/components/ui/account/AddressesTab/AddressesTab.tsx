"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Home,
  AlertCircle,
  RefreshCcw,
  Navigation,
} from "lucide-react";
import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { Address, AddressFormData, FormErrors } from "./types";
import { MAX_ADDRESSES, INITIAL_FORM_DATA, VALIDATION } from "./types";
import { AddressCardSkeleton } from "./AddressCardSkeleton";
import { AddressFormDialog } from "./AddressFormDialog";
import { DeleteAddressDialog } from "./DeleteAddressDialog";

export function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const { shouldAnimate } = useAnimationPreference();

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    setHasError(false);
    setIsLoading(true);
    try {
      const response = await fetch("/api/addresses");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Failed to fetch addresses");
      setAddresses(result.data || []);
      setAddressCount(result.meta?.count || 0);
    } catch (error) {
      setHasError(true);
      toast({
        message: error instanceof Error ? error.message : "Failed to load addresses",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    if (formData.label.length > VALIDATION.label.maxLength)
      errors.label = `Label must be less than ${VALIDATION.label.maxLength} characters`;
    if (!formData.line1.trim()) errors.line1 = "Street address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state.trim()) errors.state = "State is required";
    else if (!VALIDATION.state.pattern.test(formData.state.trim()))
      errors.state = "Enter 2-letter state code (e.g., CA)";
    if (!formData.postalCode.trim()) errors.postalCode = "Postal code is required";
    else if (!VALIDATION.postalCode.pattern.test(formData.postalCode.trim()))
      errors.postalCode = "Enter a valid ZIP code (e.g., 12345 or 12345-6789)";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors])
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const openAddDialog = () => {
    setEditingAddress(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const isEditing = editingAddress !== null;
      const url = isEditing ? `/api/addresses/${editingAddress.id}` : "/api/addresses";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.label.trim() || "Home",
          line1: formData.line1.trim(),
          line2: formData.line2.trim() || null,
          city: formData.city.trim(),
          state: formData.state.trim().toUpperCase(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const errorMessage = result.error?.message || "Failed to save address";
        if (errorMessage.includes("5") || result.error?.code === "ADDRESS_LIMIT") {
          toast({
            message: "Maximum 5 addresses allowed. Delete an address to add a new one.",
            type: "warning",
          });
          return;
        }
        throw new Error(errorMessage);
      }
      toast({ message: isEditing ? "Address updated" : "Address added", type: "success" });
      setDialogOpen(false);
      fetchAddresses();
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to save address",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;
    setIsDeleting(addressToDelete.id);
    try {
      const response = await fetch(`/api/addresses/${addressToDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Failed to delete address");
      toast({ message: "Address deleted", type: "success" });
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
      fetchAddresses();
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to delete address",
        type: "error",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton height={20} width={140} radius="sm" />
            <Skeleton height={14} width={180} radius="sm" />
          </div>
          <Skeleton height={36} width={120} radius="lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <AddressCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <m.div
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 1 } : undefined}
        className="text-center py-16"
      >
        <div className="rounded-full bg-status-error/10 w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-status-error" />
        </div>
        <h2 className="text-xl font-display font-bold text-text-primary mb-2">
          Unable to load addresses
        </h2>
        <p className="font-body text-text-secondary mb-8">
          We couldn&apos;t fetch your saved addresses. Please try again.
        </p>
        <Button variant="primary" size="lg" onClick={fetchAddresses} className="shadow-elevated">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </m.div>
    );
  }

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-text-primary">Saved Addresses</h2>
          <p className="text-sm text-text-secondary">
            {addressCount} of {MAX_ADDRESSES} addresses used
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openAddDialog}
          disabled={addressCount >= MAX_ADDRESSES}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Empty state */}
      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-curry/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 bg-surface-primary rounded-full p-2 shadow-card">
              <Navigation className="h-5 w-5 text-curry" />
            </div>
            <div className="absolute -bottom-1 -left-1 bg-surface-primary rounded-full p-1.5 shadow-card">
              <Home className="h-4 w-4 text-text-muted" />
            </div>
          </div>
          <h3 className="text-xl font-display font-bold text-text-primary mb-2">
            No saved addresses
          </h3>
          <p className="font-body text-text-secondary mb-6 max-w-sm mx-auto">
            Add an address for faster checkout. We&apos;ll remember your delivery locations.
          </p>
          <Button variant="primary" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address, index) => (
            <m.div
              key={address.id}
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2 flex-shrink-0 mt-1">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">
                            {address.label || "Address"}
                          </span>
                          {address.isDefault && (
                            <Badge variant="secondary" size="sm">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">{address.line1}</p>
                        {address.line2 && (
                          <p className="text-sm text-text-secondary">{address.line2}</p>
                        )}
                        <p className="text-sm text-text-secondary">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(address)}
                        aria-label="Edit address"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setAddressToDelete(address);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={isDeleting === address.id}
                        aria-label="Delete address"
                        className="text-status-error hover:text-status-error hover:bg-status-error/10"
                      >
                        {isDeleting === address.id ? (
                          <m.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </m.div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingAddress={editingAddress}
        formData={formData}
        formErrors={formErrors}
        isSaving={isSaving}
        onInputChange={handleInputChange}
        onSave={handleSave}
      />
      <DeleteAddressDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        address={addressToDelete}
        isDeleting={isDeleting !== null}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setAddressToDelete(null);
        }}
      />
    </m.div>
  );
}
