"use client";

import { type Resolver, type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  addressFormSchema,
  type AddressFormValues,
} from "@/lib/validations/address";
import { ADDRESS_LABELS } from "@/types/address";

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function AddressForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema) as Resolver<AddressFormValues>,
    defaultValues: {
      label: defaultValues?.label ?? "Home",
      line1: defaultValues?.line1 ?? "",
      line2: defaultValues?.line2 ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "CA",
      postalCode: defaultValues?.postalCode ?? "",
    },
  });

  const submitHandler: SubmitHandler<AddressFormValues> = async (values) => {
    await onSubmit(values);
  };

  const handleFormSubmit = handleSubmit(submitHandler);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <select
          id="label"
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            errors.label && "border-destructive"
          )}
          {...register("label")}
        >
          {ADDRESS_LABELS.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        {errors.label && (
          <p className="text-sm text-destructive">{errors.label.message}</p>
        )}
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="line1">Street Address</Label>
        <Input
          id="line1"
          placeholder="123 Main St"
          className={cn(errors.line1 && "border-destructive")}
          disabled={isLoading}
          {...register("line1")}
        />
        {errors.line1 && (
          <p className="text-sm text-destructive">{errors.line1.message}</p>
        )}
      </div>

      {/* Apt/Suite */}
      <div className="space-y-2">
        <Label htmlFor="line2">Apt, Suite, etc. (optional)</Label>
        <Input
          id="line2"
          placeholder="Apt 4B"
          disabled={isLoading}
          {...register("line2")}
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="Los Angeles"
          className={cn(errors.city && "border-destructive")}
          disabled={isLoading}
          {...register("city")}
        />
        {errors.city && (
          <p className="text-sm text-destructive">{errors.city.message}</p>
        )}
      </div>

      {/* State & ZIP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="CA"
            maxLength={2}
            className={cn(errors.state && "border-destructive")}
            disabled={isLoading}
            {...register("state")}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">ZIP Code</Label>
          <Input
            id="postalCode"
            placeholder="90001"
            className={cn(errors.postalCode && "border-destructive")}
            disabled={isLoading}
            {...register("postalCode")}
          />
          {errors.postalCode && (
            <p className="text-sm text-destructive">
              {errors.postalCode.message}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Update Address" : "Add Address"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
