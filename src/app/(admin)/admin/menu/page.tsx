"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { Plus, RefreshCw, UtensilsCrossed, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { MenuFilterBar } from "./MenuFilterBar";
import { MenuItemsTable, type MenuTableItem } from "./MenuItemsTable";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminMenuPage() {
  const { shouldAnimate } = useAnimationPreference();
  const [items, setItems] = useState<MenuTableItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu?limit=100");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const json = await response.json();
      const data: MenuTableItem[] = json.data ?? json;
      setItems(data);

      const uniqueCategories = data.reduce((acc: Category[], item) => {
        if (!acc.find((c) => c.id === item.menu_categories.id)) {
          acc.push(item.menu_categories);
        }
        return acc;
      }, []);
      setCategories(uniqueCategories);
    } catch {
      toast({
        message: "Failed to fetch menu items",
        type: "error",
      });
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

  const handleToggleActive = async (item: MenuTableItem) => {
    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
      );
    } catch {
      toast({
        message: "Failed to update item",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSoldOut = async (item: MenuTableItem) => {
    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_sold_out: !item.is_sold_out }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_sold_out: !i.is_sold_out } : i))
      );
    } catch {
      toast({
        message: "Failed to update item",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (item: MenuTableItem) => {
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
        message: err instanceof Error ? err.message : "Failed to delete item",
        type: "error",
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

    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeCount = items.filter((i) => i.is_active).length;
  const soldOutCount = items.filter((i) => i.is_sold_out).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-surface-tertiary rounded-input" />
          <div className="h-4 w-64 bg-surface-tertiary rounded-input" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-tertiary rounded-card-sm" />
            ))}
          </div>
          <div className="h-96 bg-surface-tertiary rounded-card-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
            Menu Items
          </h1>
          <p className="font-body text-text-secondary mt-1">
            Manage your menu items, prices, and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border hover:bg-surface-tertiary"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </m.div>

      {/* Stats Cards */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Items</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">{items.length}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Active</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {activeCount}
              <span className="text-sm font-body font-normal text-text-muted ml-2">
                / {items.length}
              </span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-secondary-hover">
              <Package className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Sold Out</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">{soldOutCount}</p>
          </div>
        </div>
      </m.div>

      {/* Filters */}
      <MenuFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* Items Table */}
      <MenuItemsTable
        items={filteredItems}
        updatingId={updatingId}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onToggleActive={handleToggleActive}
        onToggleSoldOut={handleToggleSoldOut}
        onDelete={handleDelete}
      />
    </div>
  );
}
