/**
 * UI Components Barrel Export
 * V5 Sprint 2.1 - Centralized UI component exports
 *
 * All UI primitives available from @/components/ui
 */

// ============================================
// CORE COMPONENTS
// ============================================

// Button
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

// Badge
export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

// Card
export {
  Card,
  AnimatedCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
} from "./card";
export type { CardProps, AnimatedCardProps } from "./card";

// ============================================
// FORM COMPONENTS
// ============================================

// Input
export { Input } from "./input";

// Textarea
export { Textarea } from "./textarea";

// Label
export { Label } from "./label";

// Checkbox
export { Checkbox } from "./checkbox";

// Radio Group
export { RadioGroup, RadioGroupItem } from "./radio-group";

// Form Validation
export {
  useFieldValidation,
  ValidationMessage,
  ValidatedInput,
  useFormValidation,
  FormValidationProvider,
  validationRules,
} from "./FormValidation";
export type {
  ValidationRule,
  ValidationState,
  FieldValidation,
  ValidationMessageProps,
  ValidatedInputProps,
  FormValidationProviderProps,
} from "./FormValidation";

// ============================================
// OVERLAY COMPONENTS
// ============================================

// Dialog
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";

// Alert Dialog
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

// Portal & Backdrop (V8)
export { Portal } from "./Portal";
export type { PortalProps } from "./Portal";
export { Backdrop } from "./Backdrop";
export type { BackdropProps } from "./Backdrop";

// Modal (V8 Consolidated)
export { Modal, useModal, ModalHeader, ModalFooter, ConfirmModal } from "./Modal";
export type { ModalProps, UseModalReturn, ModalHeaderProps, ModalFooterProps, ConfirmModalProps } from "./Modal";

// Drawer (V8 Unified - includes BottomSheet)
export { Drawer, BottomSheet } from "./Drawer";
export type { DrawerProps, BottomSheetProps } from "./Drawer";

// Dropdown Menu (Radix)
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu";

// Dropdown (V8 - simpler)
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

// Tooltip (V8)
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./Tooltip";

// ============================================
// FEEDBACK COMPONENTS
// ============================================

// Toast (V8 - declarative)
export { Toast, ToastContainer } from "./Toast";
export { ToastProvider } from "./ToastProvider";

// Alert
export { Alert, AlertTitle, AlertDescription } from "./alert";

// Progress
export { Progress } from "./progress";

// ============================================
// LOADING & STATE COMPONENTS
// ============================================

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonMenuItem,
  SkeletonTableRow,
} from "./skeleton";
export type { SkeletonProps, SkeletonTextProps, SkeletonAvatarProps, SkeletonCardProps, SkeletonTableRowProps } from "./skeleton";

// Empty State (CartEmptyState exported from ./cart subdirectory)
export {
  EmptyState,
  SearchEmptyState,
  OrdersEmptyState,
  FavoritesEmptyState,
  DriverRouteEmptyState,
  AdminOrdersEmptyState,
  ExceptionsEmptyState,
} from "./EmptyState";
export type { EmptyStateProps, EmptyStateVariant } from "./EmptyState";


// ============================================
// DISPLAY COMPONENTS
// ============================================

// Avatar
export { Avatar, AvatarImage, AvatarFallback } from "./avatar";

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";

// Scroll Area
export { ScrollArea } from "./scroll-area";

// ============================================
// NAVIGATION COMPONENTS
// ============================================

// NavDots
export { NavDots } from "./NavDots";
export type { NavDotsProps } from "./NavDots";

// ============================================
// SPECIAL COMPONENTS
// ============================================

// Theme Toggle
export { ThemeToggle } from "./theme-toggle";

// ============================================
// LAYOUT PRIMITIVES
// ============================================

// Stack
export { Stack } from "./Stack";
export type { StackProps } from "./Stack";

// Grid
export { Grid } from "./Grid";
export type { GridProps } from "./Grid";

// Container
export { Container, containerBreakpoints } from "./Container";
export type { ContainerProps, ContainerSize } from "./Container";

// Cluster
export { Cluster } from "./Cluster";
export type { ClusterProps } from "./Cluster";

// SafeArea
export { SafeArea, getSafeAreaInsets, safeAreaClasses } from "./SafeArea";
export type { SafeAreaProps, SafeAreaEdge } from "./SafeArea";

// ============================================
// SUBDIRECTORY RE-EXPORTS
// ============================================

// Cart components
export * from "./cart";

// Menu components
export * from "./menu";

// Navigation components
export * from "./navigation";

// Scroll components
export * from "./scroll";

// Transitions
export * from "./transitions";

// Layout (app shells, headers, drawers)
export * from "./layout";

// Search (command palette)
export * from "./search";

// Orders (tracking, delivery)
export * from "./orders";
