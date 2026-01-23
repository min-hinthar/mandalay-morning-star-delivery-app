/**
 * V6 Toast System - Pepper Aesthetic
 *
 * Features:
 * - V6 color palette for variants
 * - Slide-in animation from edge
 * - Rounded corners with V6 card radius
 * - Auto-dismiss: 3s (success), 5s (error), persist (action needed)
 */

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // V6 Position: top-center on mobile, bottom-right on desktop
      "fixed z-toast flex max-h-screen w-full flex-col p-4",
      "top-0 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col-reverse md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/**
 * V6 Toast Variants
 * - default: Neutral background
 * - success: V6 green with checkmark
 * - error: V6 status-error for destructive
 * - warning: V6 accent-orange
 * - info: V6 accent-teal
 */
const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center gap-3",
    "overflow-hidden p-4",
    // V6 Card styling
    "rounded-card-sm border shadow-elevated",
    // V6 Motion: Slide in animation
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full",
    "data-[state=closed]:slide-out-to-right-full",
    "data-[state=closed]:fade-out-80",
    "transition-all duration-normal",
  ].join(" "),
  {
    variants: {
      variant: {
        // V6 Default: Neutral surface
        default: [
          "bg-surface-primary border-border",
          "text-text-primary",
        ].join(" "),
        // V6 Success: Green accent
        success: [
          "bg-green/10 border-green/30",
          "text-text-primary",
        ].join(" "),
        // V6 Destructive/Error: Status error
        destructive: [
          "bg-status-error/10 border-status-error/30",
          "text-text-primary",
        ].join(" "),
        // V6 Warning: Orange accent
        warning: [
          "bg-accent-orange/10 border-accent-orange/30",
          "text-text-primary",
        ].join(" "),
        // V6 Info: Teal accent
        info: [
          "bg-accent-teal/10 border-accent-teal/30",
          "text-text-primary",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// V6 Icon mapping for toast variants
const toastIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastIconColors: Record<string, string> = {
  success: "text-green",
  destructive: "text-status-error",
  warning: "text-accent-orange",
  info: "text-accent-teal",
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  const Icon = variant ? toastIcons[variant] : null;
  const iconColor = variant ? toastIconColors[variant] : "";

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {/* V6 Icon for variant toasts */}
      {Icon && (
        <div className="flex-shrink-0">
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      )}
      <div className="flex-1">{children}</div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      // V6 Action button styling
      "inline-flex h-8 shrink-0 items-center justify-center",
      "rounded-button px-3",
      "font-body text-sm font-medium",
      "border border-border bg-surface-primary",
      "transition-all duration-fast",
      "hover:bg-surface-secondary hover:border-primary",
      "active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // V6 Close button styling
      "absolute right-2 top-2 rounded-button p-1.5",
      "text-text-muted opacity-0",
      "transition-all duration-fast",
      "hover:text-text-primary hover:bg-surface-secondary",
      "group-hover:opacity-100",
      "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      // V6 Typography
      "font-body text-sm font-semibold text-text-primary",
      className
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      // V6 Typography
      "font-body text-sm text-text-secondary",
      className
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
};
