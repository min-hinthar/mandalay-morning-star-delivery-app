import * as React from "react";

import { cn } from "@/lib/utils/cn";

interface TooltipProviderProps {
  children: React.ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  return <span className="relative inline-flex group">{children}</span>;
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export function TooltipTrigger({
  asChild,
  children,
  className,
  ...props
}: TooltipTriggerProps) {
  if (asChild && React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)) {
    const childProps = children.props;
    return React.cloneElement(children, {
      ...props,
      className: cn(childProps.className, className),
    });
  }

  return (
    <span className={cn("inline-flex", className)} {...props}>
      {children}
    </span>
  );
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLSpanElement> {
  sideOffset?: number;
}

export function TooltipContent({
  children,
  className,
  sideOffset = 6,
  style,
  ...props
}: TooltipContentProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-[var(--z-tooltip)] w-max -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-md",
        "transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
        className
      )}
      style={{ marginTop: sideOffset, ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
