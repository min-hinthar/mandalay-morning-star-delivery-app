"use client";

import { useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks, type UserRole } from "./nav-links";
import { cn } from "@/lib/utils/cn";
import type { ReactElement } from "react";

interface MobileMenuProps {
  role: UserRole;
}

export function MobileMenu({ role }: MobileMenuProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/20 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={cn(
          "fixed inset-x-0 top-[var(--header-height,57px)] z-[var(--z-modal)] border-b border-border bg-background p-4 shadow-lg transition-transform duration-200 md:hidden",
          isOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <NavLinks
          role={role}
          className="flex-col items-stretch gap-1"
          onLinkClick={closeMenu}
        />
      </div>
    </>
  );
}
