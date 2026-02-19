/**
 * InitialsAvatar - Fallback avatar showing driver's initials
 *
 * Used when no profile photo is uploaded. Shows first letter(s) of name
 * in a colored circle with deterministic color based on name hash.
 */

import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

const colors = [
  "bg-accent-teal",
  "bg-secondary",
  "bg-primary",
  "bg-green-500",
  "bg-blue-500",
  "bg-purple-500",
];

function getInitials(name: string | null): string {
  if (!name || !name.trim()) return "??";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string | null): string {
  if (!name) return "bg-gray-400";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface InitialsAvatarProps {
  name: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function InitialsAvatar({ name, size = "md", className }: InitialsAvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColor(name);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-text-inverse select-none",
        sizeMap[size],
        bgColor,
        className
      )}
      aria-label={name ? `Avatar for ${name}` : "Default avatar"}
    >
      {initials}
    </div>
  );
}
