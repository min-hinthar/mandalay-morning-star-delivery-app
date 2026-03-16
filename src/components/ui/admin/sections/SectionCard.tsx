"use client";

import { useState } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import {
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  Copy,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Sparkles,
  Utensils,
  Crown,
  Heart,
  Flame,
  Zap,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/Dropdown";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  "trending-up": TrendingUp,
  sparkles: Sparkles,
  utensils: Utensils,
  crown: Crown,
  heart: Heart,
  flame: Flame,
  zap: Zap,
};

export interface SectionCardSection {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  accentColor: string | null;
  sortOrder: number;
  itemCount: number;
  actualItemCount?: number;
  isVisible: boolean;
  isPredefined: boolean;
  deletedAt: string | null;
  items?: {
    id: string;
    nameEn: string;
    imageUrl: string | null;
    sortOrder: number;
  }[];
}

interface SectionCardProps {
  section: SectionCardSection;
  onEdit: (section: SectionCardSection) => void;
  onToggleVisibility: (section: SectionCardSection) => void;
  onDelete: (section: SectionCardSection) => void;
  onDuplicate: (section: SectionCardSection) => void;
  onRestore: (section: SectionCardSection) => void;
  onExpand: (section: SectionCardSection) => void;
  isDragging?: boolean;
  isExpanded?: boolean;
}

export function SectionCard({
  section,
  onEdit,
  onToggleVisibility,
  onDelete,
  onDuplicate,
  onRestore,
  onExpand,
  isDragging = false,
  isExpanded = false,
}: SectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { shouldAnimate } = useAnimationPreference();
  const isDeleted = !!section.deletedAt;
  const IconComponent = section.icon ? ICON_MAP[section.icon] || Star : Star;

  // Calculate days remaining for deleted sections (30-day recovery)
  const daysRemaining = isDeleted
    ? Math.max(
        0,
        30 -
          Math.floor((Date.now() - new Date(section.deletedAt!).getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return (
    <m.div
      layout
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
      className={cn(
        "relative rounded-card-sm border bg-surface-primary",
        "transition-all duration-fast",
        isDragging && "shadow-lg scale-[1.02] ring-2 ring-primary/30",
        isDeleted && "opacity-60 border-dashed",
        !isDeleted && "border-border hover:border-primary/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          {!isDeleted && (
            <div
              className={cn(
                "cursor-grab active:cursor-grabbing p-1 rounded-sm",
                "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary",
                "transition-colors duration-fast"
              )}
            >
              <GripVertical className="h-5 w-5" />
            </div>
          )}

          {/* Icon Badge */}
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              "transition-colors duration-fast"
            )}
            style={{
              backgroundColor: section.accentColor
                ? `${section.accentColor}20`
                : "var(--primary-10)",
              color: section.accentColor || "var(--primary)",
            }}
          >
            <IconComponent className="h-5 w-5" />
          </div>

          {/* Section Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-body font-medium text-text-primary truncate">{section.name}</h3>
              {section.isPredefined && (
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary bg-primary/5"
                >
                  Built-in
                </Badge>
              )}
              {isDeleted && (
                <Badge
                  variant="outline"
                  className="text-xs border-status-error/30 text-status-error bg-status-error/5"
                >
                  Deleted ({daysRemaining}d)
                </Badge>
              )}
            </div>
            {section.subtitle && (
              <p className="text-sm font-body text-text-muted truncate mt-0.5">
                {section.subtitle}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-body text-text-muted">
                {section.actualItemCount ?? section.items?.length ?? 0} / {section.itemCount} items
              </span>
              {!section.isVisible && !isDeleted && (
                <span className="text-xs font-body text-text-muted flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isDeleted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestore(section)}
                className="text-green border-green/30 hover:bg-green/10"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            ) : (
              <>
                {/* Visibility Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleVisibility(section)}
                  className={cn(
                    "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2",
                    section.isVisible ? "text-green" : "text-text-muted"
                  )}
                >
                  {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExpand(section)}
                  className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 text-text-secondary"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {/* More Actions */}
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 text-text-muted hover:text-text-primary",
                        isHovered && "opacity-100"
                      )}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent align="end">
                    <DropdownItem onClick={() => onEdit(section)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownItem>
                    <DropdownItem onClick={() => onDuplicate(section)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      onClick={() => onDelete(section)}
                      className="text-status-error hover:bg-status-error/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {section.isPredefined ? "Hide" : "Delete"}
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Items Preview */}
      {isExpanded && !isDeleted && (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border"
        >
          <div className="p-4">
            {section.items && section.items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.items.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 bg-surface-secondary rounded-md px-2 py-1.5"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.nameEn}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-surface-tertiary flex items-center justify-center">
                        <Utensils className="h-3 w-3 text-text-muted" />
                      </div>
                    )}
                    <span className="text-sm font-body text-text-secondary truncate max-w-[120px]">
                      {item.nameEn}
                    </span>
                  </div>
                ))}
                {section.items.length > 8 && (
                  <span className="text-sm font-body text-text-muted self-center">
                    +{section.items.length - 8} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm font-body text-text-muted text-center py-4">
                No items in this section. Click to add items.
              </p>
            )}
          </div>
        </m.div>
      )}
    </m.div>
  );
}
