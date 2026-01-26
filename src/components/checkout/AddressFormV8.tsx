"use client";

import { type Resolver, type SubmitHandler, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ValidatedInput, type ValidationState } from "@/components/ui/FormValidation";
import { ErrorShake, useErrorShake } from "@/components/ui/error-shake";
import { AnimatedFormField } from "./AnimatedFormField";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import {
  addressFormSchema,
  type AddressFormValues,
} from "@/lib/validations/address";
import { ADDRESS_LABELS } from "@/types/address";

interface AddressFormV8Props {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

/**
 * AddressFormV8 - Address form with micro-interactions
 *
 * Enhanced version with:
 * - Subtle scale animation on field focus
 * - Shake animation on validation errors
 * - Animated checkmark on valid fields
 * - Animated error message slide in/out
 *
 * Same props interface as AddressForm for compatibility.
 */
export function AddressFormV8({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: AddressFormV8Props) {
  const { getSpring } = useAnimationPreference();
  const { shake: errorShake, triggerShake } = useErrorShake();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, touchedFields },
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

  // Trigger shake on validation errors
  const handleFormSubmit = handleSubmit(submitHandler, () => {
    triggerShake();
  });

  /**
   * Get validation state for a field based on react-hook-form state
   */
  function getFieldState(field: keyof AddressFormValues): ValidationState {
    if (errors[field]) return "invalid";
    if (touchedFields[field] && dirtyFields[field]) return "valid";
    return "idle";
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Form-level error message with animation and shake */}
      <ErrorShake shake={errorShake && !!error}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="form-error"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={getSpring(spring.default)}
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </ErrorShake>

      {/* Label (select) */}
      <AnimatedFormField>
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <select
            id="label"
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors duration-150",
              errors.label && "border-destructive"
            )}
            disabled={isLoading}
            {...register("label")}
          >
            {ADDRESS_LABELS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <AnimatePresence mode="wait">
            {errors.label && (
              <motion.p
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={getSpring(spring.snappy)}
                className="text-sm text-destructive"
              >
                {errors.label.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </AnimatedFormField>

      {/* Street Address */}
      <AnimatedFormField>
        <Controller
          name="line1"
          control={control}
          render={({ field }) => (
            <ValidatedInput
              id="line1"
              label="Street Address"
              placeholder="123 Main St"
              disabled={isLoading}
              validationState={getFieldState("line1")}
              errorMessage={errors.line1?.message}
              shakeOnError={true}
              showSuccess={true}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </AnimatedFormField>

      {/* Apt/Suite */}
      <AnimatedFormField>
        <Controller
          name="line2"
          control={control}
          render={({ field }) => (
            <ValidatedInput
              id="line2"
              label="Apt, Suite, etc. (optional)"
              placeholder="Apt 4B"
              disabled={isLoading}
              validationState={getFieldState("line2")}
              errorMessage={errors.line2?.message}
              shakeOnError={true}
              showSuccess={false}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </AnimatedFormField>

      {/* City */}
      <AnimatedFormField>
        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <ValidatedInput
              id="city"
              label="City"
              placeholder="Los Angeles"
              disabled={isLoading}
              validationState={getFieldState("city")}
              errorMessage={errors.city?.message}
              shakeOnError={true}
              showSuccess={true}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </AnimatedFormField>

      {/* State & ZIP */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatedFormField>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <ValidatedInput
                id="state"
                label="State"
                placeholder="CA"
                maxLength={2}
                disabled={isLoading}
                validationState={getFieldState("state")}
                errorMessage={errors.state?.message}
                shakeOnError={true}
                showSuccess={true}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </AnimatedFormField>

        <AnimatedFormField>
          <Controller
            name="postalCode"
            control={control}
            render={({ field }) => (
              <ValidatedInput
                id="postalCode"
                label="ZIP Code"
                placeholder="90001"
                disabled={isLoading}
                validationState={getFieldState("postalCode")}
                errorMessage={errors.postalCode?.message}
                shakeOnError={true}
                showSuccess={true}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </AnimatedFormField>
      </div>

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
