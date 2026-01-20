/**
 * V6 Admin Menu Page - Pepper Aesthetic
 *
 * Menu item management page with V6 colors, typography, and animations.
 * Features stats cards, search/filters, and menu item table.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  UtensilsCrossed,
  CheckCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface MenuItem {
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

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const data: MenuItem[] = await response.json();
      setItems(data);

      // Extract unique categories
      const uniqueCategories = data.reduce((acc: Category[], item) => {
        if (!acc.find((c) => c.id === item.menu_categories.id)) {
          acc.push(item.menu_categories);
        }
        return acc;
      }, []);
      setCategories(uniqueCategories);
    } catch {
      toast({ title: "Error", description: "Failed to fetch menu items", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleToggleActive = async (item: MenuItem) => {
    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_active: !i.is_active } : i
        )
      );
    } catch {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSoldOut = async (item: MenuItem) => {
    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_sold_out: !item.is_sold_out }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_sold_out: !i.is_sold_out } : i
        )
      );
    } catch {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name_en}"? This cannot be undone.`)) {
      return;
    }

    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeCount = items.filter((i) => i.is_active).length;
  const soldOutCount = items.filter((i) => i.is_sold_out).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-v6-surface-tertiary rounded-v6-input" />
          <div className="h-4 w-64 bg-v6-surface-tertiary rounded-v6-input" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-v6-surface-tertiary rounded-v6-card-sm" />
            ))}
          </div>
          <div className="h-96 bg-v6-surface-tertiary rounded-v6-card-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-v6-display font-bold text-v6-text-primary">
            Menu Items
          </h1>
          <p className="font-v6-body text-v6-text-secondary mt-1">
            Manage your menu items, prices, and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-v6-border hover:bg-v6-surface-tertiary"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button className="bg-v6-primary hover:bg-v6-primary-hover text-white shadow-v6-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Items */}
        <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-surface-secondary border border-v6-border p-4 shadow-v6-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-v6-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-v6-primary">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-sm font-v6-body font-medium">Total Items</span>
            </div>
            <p className="text-3xl font-v6-display font-bold text-v6-text-primary mt-2">
              {items.length}
            </p>
          </div>
        </div>

        {/* Active Items */}
        <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-green/5 border border-v6-green/20 p-4 shadow-v6-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-v6-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-v6-green">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-v6-body font-medium">Active</span>
            </div>
            <p className="text-3xl font-v6-display font-bold text-v6-text-primary mt-2">
              {activeCount}
              <span className="text-sm font-v6-body font-normal text-v6-text-muted ml-2">
                / {items.length}
              </span>
            </p>
          </div>
        </div>

        {/* Sold Out */}
        <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-secondary/5 border border-v6-secondary/20 p-4 shadow-v6-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-v6-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-v6-secondary-hover">
              <Package className="h-5 w-5" />
              <span className="text-sm font-v6-body font-medium">Sold Out</span>
            </div>
            <p className="text-3xl font-v6-display font-bold text-v6-text-primary mt-2">
              {soldOutCount}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-v6-text-muted" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all duration-v6-fast font-v6-body",
              selectedCategory === "all"
                ? "bg-v6-primary hover:bg-v6-primary-hover text-white border-transparent"
                : "bg-v6-surface-primary border-v6-border text-v6-text-primary hover:bg-v6-primary/10 hover:border-v6-primary/30"
            )}
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all duration-v6-fast font-v6-body",
                selectedCategory === category.id
                  ? "bg-v6-primary hover:bg-v6-primary-hover text-white border-transparent"
                  : "bg-v6-surface-primary border-v6-border text-v6-text-primary hover:bg-v6-primary/10 hover:border-v6-primary/30"
              )}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Items Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-v6-surface-secondary rounded-v6-card-sm border border-v6-border">
            <AlertCircle className="h-12 w-12 text-v6-text-muted mx-auto mb-4" />
            <h2 className="text-lg font-v6-display font-medium text-v6-text-primary mb-2">
              No items found
            </h2>
            <p className="font-v6-body text-v6-text-secondary">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your filters"
                : "Add your first menu item to get started"}
            </p>
          </div>
        ) : (
          <div className="rounded-v6-card-sm border border-v6-border bg-v6-surface-primary overflow-hidden shadow-v6-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-v6-surface-secondary hover:bg-v6-surface-secondary">
                  <TableHead className="w-[250px] font-v6-body font-medium text-v6-text-secondary">
                    Item
                  </TableHead>
                  <TableHead className="font-v6-body font-medium text-v6-text-secondary">
                    Category
                  </TableHead>
                  <TableHead className="text-right font-v6-body font-medium text-v6-text-secondary">
                    Price
                  </TableHead>
                  <TableHead className="text-center font-v6-body font-medium text-v6-text-secondary">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-v6-body font-medium text-v6-text-secondary">
                    Sold Out
                  </TableHead>
                  <TableHead className="w-[100px] font-v6-body font-medium text-v6-text-secondary">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isUpdating = updatingId === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "hover:bg-v6-surface-secondary/50 transition-colors duration-v6-fast",
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
                              className="h-10 w-10 rounded-v6-input object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-v6-input bg-v6-surface-tertiary flex items-center justify-center text-v6-text-muted text-xs font-v6-body">
                              No img
                            </div>
                          )}
                          <div>
                            <p className="font-v6-body font-medium text-v6-text-primary">
                              {item.name_en}
                            </p>
                            <p className="text-xs font-v6-body text-v6-text-muted font-mono">
                              {item.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-v6-border text-v6-text-secondary font-v6-body"
                        >
                          {item.menu_categories.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-v6-body font-medium text-v6-primary">
                        {formatPrice(item.base_price_cents)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                          disabled={isUpdating}
                          className="p-1 hover:bg-transparent"
                        >
                          {item.is_active ? (
                            <ToggleRight className="h-6 w-6 text-v6-green" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-v6-text-muted" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSoldOut(item)}
                          disabled={isUpdating}
                          className="p-1 hover:bg-transparent"
                        >
                          {item.is_sold_out ? (
                            <Badge className="bg-v6-secondary/10 text-v6-secondary-hover hover:bg-v6-secondary/20 border-0">
                              Sold Out
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-v6-border text-v6-text-secondary hover:bg-v6-surface-tertiary"
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
                              className="hover:bg-v6-surface-tertiary"
                            >
                              <Edit2 className="h-4 w-4 text-v6-text-secondary" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-v6-surface-primary border-v6-border rounded-v6-input shadow-v6-md"
                          >
                            <DropdownMenuItem className="font-v6-body hover:bg-v6-surface-tertiary cursor-pointer">
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-v6-border" />
                            <DropdownMenuItem
                              className="font-v6-body text-v6-status-error hover:bg-v6-status-error/10 cursor-pointer"
                              onClick={() => handleDelete(item)}
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
      </motion.div>
    </div>
  );
}
