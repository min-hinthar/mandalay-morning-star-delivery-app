"use client";

import { m } from "framer-motion";
import { Edit2, Trash2, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MenuTableItem {
  id: string;
  category_id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
  menu_categories: {
    id: string;
    name: string;
    slug: string;
  };
}

interface MenuItemsTableProps {
  items: MenuTableItem[];
  updatingId: string | null;
  searchQuery: string;
  selectedCategory: string;
  onToggleActive: (item: MenuTableItem) => void;
  onToggleSoldOut: (item: MenuTableItem) => void;
  onDelete: (item: MenuTableItem) => void;
}

export function MenuItemsTable({
  items,
  updatingId,
  searchQuery,
  selectedCategory,
  onToggleActive,
  onToggleSoldOut,
  onDelete,
}: MenuItemsTableProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {items.length === 0 ? (
        <div className="text-center py-16 bg-surface-secondary rounded-card-sm border border-border">
          <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-display font-medium text-text-primary mb-2">
            No items found
          </h2>
          <p className="font-body text-text-secondary">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting your filters"
              : "Add your first menu item to get started"}
          </p>
        </div>
      ) : (
        <div className="rounded-card-sm border border-border bg-surface-primary overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-secondary hover:bg-surface-secondary">
                <TableHead className="w-[250px] font-body font-medium text-text-secondary">
                  Item
                </TableHead>
                <TableHead className="font-body font-medium text-text-secondary">
                  Category
                </TableHead>
                <TableHead className="text-right font-body font-medium text-text-secondary">
                  Price
                </TableHead>
                <TableHead className="text-center font-body font-medium text-text-secondary">
                  Status
                </TableHead>
                <TableHead className="text-center font-body font-medium text-text-secondary">
                  Sold Out
                </TableHead>
                <TableHead className="w-[100px] font-body font-medium text-text-secondary">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isUpdating = updatingId === item.id;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "hover:bg-surface-secondary/50 transition-colors duration-fast",
                      !item.is_active && "opacity-50",
                      isUpdating && "opacity-70"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name_en}
                            className="h-10 w-10 rounded-input object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-input bg-surface-tertiary flex items-center justify-center text-text-muted text-xs font-body">
                            No img
                          </div>
                        )}
                        <div>
                          <p className="font-body font-medium text-text-primary">{item.name_en}</p>
                          <p className="text-xs font-body text-text-muted font-mono">{item.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-border text-text-secondary font-body"
                      >
                        {item.menu_categories.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-body font-medium text-primary">
                      {formatPrice(item.base_price_cents)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(item)}
                        disabled={isUpdating}
                        className="p-1 hover:bg-transparent"
                      >
                        {item.is_active ? (
                          <ToggleRight className="h-6 w-6 text-green" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-text-muted" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleSoldOut(item)}
                        disabled={isUpdating}
                        className="p-1 hover:bg-transparent"
                      >
                        {item.is_sold_out ? (
                          <Badge className="bg-secondary/10 text-secondary-hover hover:bg-secondary/20 border-0">
                            Sold Out
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-border text-text-secondary hover:bg-surface-tertiary"
                          >
                            In Stock
                          </Badge>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            className="hover:bg-surface-tertiary"
                          >
                            <Edit2 className="h-4 w-4 text-text-secondary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-surface-primary border-border rounded-input shadow-md"
                        >
                          <DropdownMenuItem
                            className="font-body hover:bg-surface-tertiary cursor-pointer"
                            onClick={() => (window.location.href = `/admin/menu/${item.id}`)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            className="font-body text-status-error hover:bg-status-error/10 cursor-pointer"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </m.div>
  );
}
