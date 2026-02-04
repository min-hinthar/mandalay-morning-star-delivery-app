"use client";

/**
 * Addresses Tab Component
 * Manage saved delivery addresses (max 5)
 *
 * Features:
 * - List saved addresses with default badge
 * - Skeleton loading state with address card placeholders
 * - Empty state with location-themed illustration
 * - Add, edit, delete addresses with validation
 * - Set default address
 * - Enforces 5 address limit
 * - Form validation on submit with inline errors
 */

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
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const MAX_ADDRESSES = 5;

interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
  createdAt: string;
}

interface AddressFormData {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface FormErrors {
  label?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

const INITIAL_FORM_DATA: AddressFormData = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
};

// Validation patterns
const VALIDATION = {
  label: { maxLength: 50 },
  postalCode: { pattern: /^\d{5}(-\d{4})?$/ },
  state: { pattern: /^[A-Za-z]{2}$/ },
};

// Address Card Skeleton Component
function AddressCardSkeleton() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton width={36} height={36} radius="full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton height={18} width={80} radius="sm" />
                <Skeleton height={20} width={60} radius="lg" />
              </div>
              <Skeleton height={14} width="80%" radius="sm" />
              <Skeleton height={14} width="60%" radius="sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton width={32} height={32} radius="md" />
            <Skeleton width={32} height={32} radius="md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
      const response = await fetch("/api/account/addresses");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch addresses");
      }

      setAddresses(result.data || []);
      setAddressCount(result.meta?.count || 0);
    } catch (error) {
      setHasError(true);
      toast({
        message:
          error instanceof Error ? error.message : "Failed to load addresses",
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

    // Label (optional but max length)
    if (formData.label.length > VALIDATION.label.maxLength) {
      errors.label = `Label must be less than ${VALIDATION.label.maxLength} characters`;
    }

    // Line 1 (required)
    if (!formData.line1.trim()) {
      errors.line1 = "Street address is required";
    }

    // City (required)
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    // State (required, 2-letter code)
    if (!formData.state.trim()) {
      errors.state = "State is required";
    } else if (!VALIDATION.state.pattern.test(formData.state.trim())) {
      errors.state = "Enter 2-letter state code (e.g., CA)";
    }

    // Postal code (required, valid US ZIP)
    if (!formData.postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    } else if (!VALIDATION.postalCode.pattern.test(formData.postalCode.trim())) {
      errors.postalCode = "Enter a valid ZIP code (e.g., 12345 or 12345-6789)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Clear specific field error on change
  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Open add dialog
  const openAddDialog = () => {
    setEditingAddress(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open edit dialog
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

  // Save address (create or update)
  const handleSave = async () => {
    // Validate on submit
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = editingAddress !== null;
      const url = isEditing
        ? `/api/account/addresses/${editingAddress.id}`
        : "/api/account/addresses";
      const method = isEditing ? "PATCH" : "POST";

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
        // Check for max addresses error
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

      toast({
        message: isEditing ? "Address updated" : "Address added",
        type: "success",
      });
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

  // Open delete confirmation
  const openDeleteDialog = (address: Address) => {
    setAddressToDelete(address);
    setDeleteDialogOpen(true);
  };

  // Delete address
  const handleDelete = async () => {
    if (!addressToDelete) return;

    setIsDeleting(addressToDelete.id);
    try {
      const response = await fetch(`/api/account/addresses/${addressToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to delete address");
      }

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
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton height={20} width={140} radius="sm" />
            <Skeleton height={14} width={180} radius="sm" />
          </div>
          <Skeleton height={36} width={120} radius="lg" />
        </div>

        {/* Address cards skeleton */}
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
      <motion.div
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
        <Button
          variant="primary"
          size="lg"
          onClick={fetchAddresses}
          className="shadow-elevated"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
    >
      {/* Header with count and add button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-text-primary">
            Saved Addresses
          </h2>
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

      {/* Empty state with illustration */}
      {addresses.length === 0 ? (
        <div className="text-center py-12">
          {/* Illustration: Map/location themed */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-curry/10" />
            {/* Main icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            {/* Decorative elements */}
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
        /* Address list */
        <div className="space-y-4">
          {addresses.map((address, index) => (
            <motion.div
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
                        <p className="text-sm text-text-secondary">
                          {address.line1}
                        </p>
                        {address.line2 && (
                          <p className="text-sm text-text-secondary">
                            {address.line2}
                          </p>
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
                        onClick={() => openDeleteDialog(address)}
                        disabled={isDeleting === address.id}
                        aria-label="Delete address"
                        className="text-status-error hover:text-status-error hover:bg-status-error/10"
                      >
                        {isDeleting === address.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update your delivery address details"
                : "Add a new delivery address"}
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
                onChange={(e) => handleInputChange("label", e.target.value)}
                placeholder="e.g., Home, Work, Office"
                aria-invalid={!!formErrors.label}
                aria-describedby={formErrors.label ? "label-error" : undefined}
                className={formErrors.label ? "border-status-error focus:ring-status-error" : ""}
              />
              <AnimatePresence>
                {formErrors.label && (
                  <motion.p
                    id="label-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {formErrors.label}
                  </motion.p>
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
                onChange={(e) => handleInputChange("line1", e.target.value)}
                placeholder="Street address"
                aria-invalid={!!formErrors.line1}
                aria-describedby={formErrors.line1 ? "line1-error" : undefined}
                className={formErrors.line1 ? "border-status-error focus:ring-status-error" : ""}
              />
              <AnimatePresence>
                {formErrors.line1 && (
                  <motion.p
                    id="line1-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {formErrors.line1}
                  </motion.p>
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
                onChange={(e) => handleInputChange("line2", e.target.value)}
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
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                aria-invalid={!!formErrors.city}
                aria-describedby={formErrors.city ? "city-error" : undefined}
                className={formErrors.city ? "border-status-error focus:ring-status-error" : ""}
              />
              <AnimatePresence>
                {formErrors.city && (
                  <motion.p
                    id="city-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 text-sm text-status-error"
                  >
                    {formErrors.city}
                  </motion.p>
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
                  onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                  placeholder="CA"
                  maxLength={2}
                  aria-invalid={!!formErrors.state}
                  aria-describedby={formErrors.state ? "state-error" : undefined}
                  className={formErrors.state ? "border-status-error focus:ring-status-error" : ""}
                />
                <AnimatePresence>
                  {formErrors.state && (
                    <motion.p
                      id="state-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1 text-sm text-status-error"
                    >
                      {formErrors.state}
                    </motion.p>
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
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  placeholder="12345"
                  aria-invalid={!!formErrors.postalCode}
                  aria-describedby={formErrors.postalCode ? "postalCode-error" : undefined}
                  className={formErrors.postalCode ? "border-status-error focus:ring-status-error" : ""}
                />
                <AnimatePresence>
                  {formErrors.postalCode && (
                    <motion.p
                      id="postalCode-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1 text-sm text-status-error"
                    >
                      {formErrors.postalCode}
                    </motion.p>
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
                onChange={(e) => handleInputChange("isDefault", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-medium text-text-primary"
              >
                Set as default address
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
            >
              {editingAddress ? "Save Changes" : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {addressToDelete && (
            <div className="py-4">
              <div className="bg-surface-secondary rounded-card-sm p-4">
                <p className="font-medium text-text-primary">
                  {addressToDelete.label || "Address"}
                </p>
                <p className="text-sm text-text-secondary">{addressToDelete.line1}</p>
                <p className="text-sm text-text-secondary">
                  {addressToDelete.city}, {addressToDelete.state}{" "}
                  {addressToDelete.postalCode}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAddressToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting !== null}
              isLoading={isDeleting !== null}
            >
              Delete Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
