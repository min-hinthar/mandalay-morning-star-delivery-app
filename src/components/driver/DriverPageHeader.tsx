/**
 * V6 Driver Page Header - Pepper Aesthetic
 *
 * Composed header with optional high-contrast toggle.
 * Wraps DriverHeader and adds V6-styled contrast toggle by default.
 */

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
