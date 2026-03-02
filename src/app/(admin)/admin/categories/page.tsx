"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { RefreshCw, FolderTree, CheckCircle, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { Button } from "@/components/ui/button";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { CategoriesTable, type CategoryRow } from "./CategoriesTable";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const json = await response.json();
      const data: CategoryRow[] = json.data ?? json;
      setCategories(data);
    } catch {
      toast({
        message: "Failed to fetch categories",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleToggleActive = async (category: CategoryRow) => {
    setUpdatingId(category.id);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) throw new Error("Failed to update category");

      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch {
      toast({
        message: "Failed to update category",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMove = async (category: CategoryRow, direction: "up" | "down") => {
    const currentIndex = categories.findIndex((c) => c.id === category.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const targetCategory = categories[targetIndex];
    setUpdatingId(category.id);

    try {
      const [response1, response2] = await Promise.all([
        fetch(`/api/admin/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: targetCategory.sort_order }),
        }),
        fetch(`/api/admin/categories/${targetCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: category.sort_order }),
        }),
      ]);

      if (!response1.ok || !response2.ok) {
        throw new Error("Failed to reorder categories");
      }

      setCategories((prev) => {
        const newCategories = [...prev];
        const currentSortOrder = newCategories[currentIndex].sort_order;
        newCategories[currentIndex].sort_order = newCategories[targetIndex].sort_order;
        newCategories[targetIndex].sort_order = currentSortOrder;
        return newCategories.sort((a, b) => a.sort_order - b.sort_order);
      });
    } catch {
      toast({
        message: "Failed to reorder categories",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (category: CategoryRow) => {
    if (category.item_count > 0) {
      toast({
        message: `"${category.name}" has ${category.item_count} menu item(s). Remove or reassign items first.`,
        type: "error",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    setUpdatingId(category.id);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast({
        message: `"${category.name}" has been deleted`,
        type: "success",
      });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to delete category",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCategoryCreated = () => {
    fetchCategories();
  };

  const activeCount = categories.filter((c) => c.is_active).length;
  const totalItems = categories.reduce((sum, c) => sum + c.item_count, 0);

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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
            Categories
          </h1>
          <p className="font-body text-text-secondary mt-1">
            Manage menu categories, order, and visibility
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
          <AddCategoryDialog onCategoryCreated={handleCategoryCreated} />
        </div>
      </m.div>

      {/* Stats Cards */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <FolderTree className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Categories</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {categories.length}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Active</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">{activeCount}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Items</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">{totalItems}</p>
          </div>
        </div>
      </m.div>

      {/* Categories Table */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CategoriesTable
          categories={categories}
          updatingId={updatingId}
          onToggleActive={handleToggleActive}
          onMove={handleMove}
          onDelete={handleDelete}
        />
      </m.div>
    </div>
  );
}
