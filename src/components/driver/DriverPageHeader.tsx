"use client";

import { DriverHeader } from "./DriverHeader";
import { HighContrastToggle } from "./HighContrastToggle";

interface DriverPageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  showContrastToggle?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

/**
 * Driver page header with optional high-contrast toggle
 *
 * Wraps DriverHeader and adds the contrast toggle by default.
 * Set showContrastToggle={false} to hide the toggle.
 */
export function DriverPageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  showContrastToggle = true,
  rightContent,
  className,
}: DriverPageHeaderProps) {
  // Combine custom rightContent with contrast toggle
  const combinedRightContent = (
    <>
      {rightContent}
      {showContrastToggle && <HighContrastToggle />}
    </>
  );

  return (
    <DriverHeader
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      backHref={backHref}
      rightContent={combinedRightContent}
      className={className}
    />
  );
}
