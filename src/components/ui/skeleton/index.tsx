/**
 * Skeleton - Barrel Export
 *
 * Re-exports all 11 original exports from the split sub-files.
 */

// Base skeleton (2 exports: component + props type)
export { Skeleton } from "./base";
export type { SkeletonProps } from "./base";

// Text & Avatar skeletons (4 exports: 2 components + 2 prop types)
export { SkeletonText, SkeletonAvatar } from "./text-skeletons";
export type { SkeletonTextProps, SkeletonAvatarProps } from "./text-skeletons";

// Card & MenuItem skeletons (3 exports: 2 components + 1 prop type)
export { SkeletonCard, SkeletonMenuItem } from "./card-skeletons";
export type { SkeletonCardProps } from "./card-skeletons";

// Table skeleton (2 exports: component + props type)
export { SkeletonTableRow } from "./table-skeletons";
export type { SkeletonTableRowProps } from "./table-skeletons";
