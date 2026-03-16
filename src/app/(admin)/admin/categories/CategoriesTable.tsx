"use client";

import { ChevronUp, ChevronDown, ToggleLeft, ToggleRight, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  item_count: number;
}

interface CategoriesTableProps {
  categories: CategoryRow[];
  updatingId: string | null;
  onToggleActive: (category: CategoryRow) => void;
  onMove: (category: CategoryRow, direction: "up" | "down") => void;
  onDelete: (category: CategoryRow) => void;
}

export function CategoriesTable({
  categories,
  updatingId,
  onToggleActive,
  onMove,
  onDelete,
}: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-16 bg-surface-secondary rounded-card-sm border border-border">
        <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-lg font-display font-medium text-text-primary mb-2">
          No categories yet
        </h2>
        <p className="font-body text-text-secondary">
          Add your first category to start organizing menu items
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-2 md:hidden">
        {categories.map((category, index) => {
          const isUpdating = updatingId === category.id;
          const isFirst = index === 0;
          const isLast = index === categories.length - 1;

          return (
            <div
              key={category.id}
              className={cn(
                "flex items-center gap-3 rounded-card-sm border border-border bg-surface-primary p-3 shadow-sm",
                !category.is_active && "opacity-50",
                isUpdating && "opacity-70"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-sm text-text-primary">{category.name}</p>
                <span className="text-xs font-body text-text-secondary">
                  {category.item_count} items
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleActive(category)}
                  disabled={isUpdating}
                  className="h-11 w-11 p-0 hover:bg-transparent"
                >
                  {category.is_active ? (
                    <ToggleRight className="h-6 w-6 text-green" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-text-muted" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 p-0 hover:bg-surface-tertiary"
                  onClick={() => onMove(category, "up")}
                  disabled={isFirst || isUpdating}
                >
                  <ChevronUp className="h-4 w-4 text-text-secondary" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 p-0 hover:bg-surface-tertiary"
                  onClick={() => onMove(category, "down")}
                  disabled={isLast || isUpdating}
                >
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block rounded-card-sm border border-border bg-surface-primary overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-secondary hover:bg-surface-secondary">
              <TableHead className="w-[80px] font-body font-medium text-text-secondary">
                Order
              </TableHead>
              <TableHead className="font-body font-medium text-text-secondary">Name</TableHead>
              <TableHead className="font-body font-medium text-text-secondary">Slug</TableHead>
              <TableHead className="text-center font-body font-medium text-text-secondary">
                Items
              </TableHead>
              <TableHead className="text-center font-body font-medium text-text-secondary">
                Status
              </TableHead>
              <TableHead className="w-[100px] font-body font-medium text-text-secondary">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => {
              const isUpdating = updatingId === category.id;
              const isFirst = index === 0;
              const isLast = index === categories.length - 1;

              return (
                <TableRow
                  key={category.id}
                  className={cn(
                    "hover:bg-surface-secondary/50 transition-colors duration-fast",
                    !category.is_active && "opacity-50",
                    isUpdating && "opacity-70"
                  )}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-surface-tertiary"
                        onClick={() => onMove(category, "up")}
                        disabled={isFirst || isUpdating}
                      >
                        <ChevronUp className="h-4 w-4 text-text-secondary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-surface-tertiary"
                        onClick={() => onMove(category, "down")}
                        disabled={isLast || isUpdating}
                      >
                        <ChevronDown className="h-4 w-4 text-text-secondary" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-body font-medium text-text-primary">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-surface-tertiary px-2 py-1 rounded-input font-mono text-text-secondary">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="border-border text-text-secondary font-body"
                    >
                      {category.item_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(category)}
                      disabled={isUpdating}
                      className="p-1 hover:bg-transparent"
                    >
                      {category.is_active ? (
                        <ToggleRight className="h-6 w-6 text-green" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-text-muted" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(category)}
                      disabled={isUpdating || category.item_count > 0}
                      className={cn(
                        "p-1 hover:bg-status-error/10",
                        category.item_count > 0 && "opacity-30 cursor-not-allowed"
                      )}
                      title={
                        category.item_count > 0
                          ? "Cannot delete: has menu items"
                          : "Delete category"
                      }
                    >
                      <Trash2 className="h-4 w-4 text-status-error" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
