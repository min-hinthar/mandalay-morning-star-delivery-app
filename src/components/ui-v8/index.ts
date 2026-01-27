/**
 * V8 Component Library
 * Fresh overlay components with proper DOM management and spring animations
 */

// Overlay primitives
export { Portal } from "./overlay";
export type { PortalProps } from "./overlay";
export { Backdrop } from "./overlay";
export type { BackdropProps } from "./overlay";

// Overlay components (deprecated - use @/components/ui instead)
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
// BottomSheet merged into Drawer in ui/ with position="bottom"
export { BottomSheet } from "@/components/ui/Drawer";
export type { BottomSheetProps } from "@/components/ui/Drawer";
export { Drawer } from "./Drawer";
export type { DrawerProps } from "./Drawer";
export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "./Dropdown";
export type {
  DropdownProps,
  DropdownTriggerProps,
  DropdownContentProps,
  DropdownItemProps,
  DropdownSeparatorProps,
} from "./Dropdown";

// Tooltip
export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./Tooltip";

// Toast
export { Toast, ToastContainer } from "./Toast";
export { ToastProvider } from "./ToastProvider";
export type { Toast as ToastType } from "@/lib/hooks/useToastV8";

// Menu components - migrated to @/components/ui/menu
// Re-export for backwards compatibility
export {
  CategoryTabs,
  CategoryTabs as CategoryTabsV8,
  MenuSection,
  MenuSection as MenuSectionV8,
} from "@/components/ui/menu";
export type {
  CategoryTabsProps,
  CategoryTabsProps as CategoryTabsV8Props,
  Category,
  MenuSectionProps,
  MenuSectionProps as MenuSectionV8Props,
  MenuSectionCategory,
} from "@/components/ui/menu";
