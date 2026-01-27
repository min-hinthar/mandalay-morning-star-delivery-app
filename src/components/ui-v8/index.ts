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

// Menu components
export { CategoryTabsV8 } from "./menu/CategoryTabsV8";
export type { CategoryTabsV8Props, Category } from "./menu/CategoryTabsV8";
export { MenuSectionV8 } from "./menu/MenuSectionV8";
export type { MenuSectionV8Props, MenuSectionCategory } from "./menu/MenuSectionV8";
