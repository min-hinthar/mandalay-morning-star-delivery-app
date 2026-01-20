/**
 * V6 Admin Categories Page - Pepper Aesthetic
 *
 * Category management page with V6 colors, typography, and animations.
 * Features stats cards, reorder controls, and categories table.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Trash2,
  AlertCircle,
  Loader2,
  FolderTree,
  CheckCircle,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  item_count: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [creating, setCreating] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data: Category[] = await response.json();
      setCategories(data);
    } catch {
      toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" });
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

  const handleToggleActive = async (category: Category) => {
    setUpdatingId(category.id);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) throw new Error("Failed to update category");

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    } catch {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMove = async (category: Category, direction: "up" | "down") => {
    const currentIndex = categories.findIndex((c) => c.id === category.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const targetCategory = categories[targetIndex];
    setUpdatingId(category.id);

    try {
      // Swap sort_order values
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

      // Update local state
      setCategories((prev) => {
        const newCategories = [...prev];
        const currentSortOrder = newCategories[currentIndex].sort_order;
        newCategories[currentIndex].sort_order =
          newCategories[targetIndex].sort_order;
        newCategories[targetIndex].sort_order = currentSortOrder;
        return newCategories.sort((a, b) => a.sort_order - b.sort_order);
      });
    } catch {
      toast({ title: "Error", description: "Failed to reorder categories", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.item_count > 0) {
      toast({
        title: "Cannot delete",
        description: `"${category.name}" has ${category.item_count} menu item(s). Remove or reassign items first.`,
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${category.name}"? This cannot be undone.`
      )
    ) {
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
      toast({ title: "Deleted", description: `"${category.name}" has been deleted` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      toast({ title: "Validation error", description: "Name and slug are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          slug: newCategory.slug.trim().toLowerCase(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      const created = await response.json();
      setCategories((prev) =>
        [...prev, { ...created, item_count: 0 }].sort(
          (a, b) => a.sort_order - b.sort_order
        )
      );
      setNewCategory({ name: "", slug: "" });
      setAddDialogOpen(false);
      toast({ title: "Created", description: `Category "${newCategory.name}" created successfully` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const activeCount = categories.filter((c) => c.is_active).length;
  const totalItems = categories.reduce((sum, c) => sum + c.item_count, 0);

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
            Categories
          </h1>
          <p className="font-v6-body text-v6-text-secondary mt-1">
            Manage menu categories, order, and visibility
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
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-v6-primary hover:bg-v6-primary-hover text-white shadow-v6-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-v6-surface-primary border-v6-border rounded-v6-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-v6-display text-2xl text-v6-text-primary">
                  <div className="p-2 rounded-v6-input bg-v6-primary text-white">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  Add New Category
                </DialogTitle>
                <DialogDescription className="font-v6-body text-v6-text-secondary">
                  Create a new menu category. Categories are used to organize
                  menu items.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-v6-body font-medium text-v6-text-primary"
                  >
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Appetizers"
                    value={newCategory.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewCategory({
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    className="bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-sm font-v6-body font-medium text-v6-text-primary"
                  >
                    Slug
                  </Label>
                  <Input
                    id="slug"
                    placeholder="e.g., appetizers"
                    value={newCategory.slug}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase(),
                      }))
                    }
                    className="bg-v6-surface-primary border-v6-border focus:border-v6-primary focus:ring-v6-primary/20 rounded-v6-input font-mono"
                  />
                  <p className="text-xs font-v6-body text-v6-text-muted">
                    URL-friendly identifier. Lowercase, no spaces.
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  className="border-v6-border hover:bg-v6-surface-tertiary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={creating}
                  className="bg-v6-primary hover:bg-v6-primary-hover text-white shadow-v6-sm"
                >
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Categories */}
        <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-surface-secondary border border-v6-border p-4 shadow-v6-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-v6-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-v6-primary">
              <FolderTree className="h-5 w-5" />
              <span className="text-sm font-v6-body font-medium">Total Categories</span>
            </div>
            <p className="text-3xl font-v6-display font-bold text-v6-text-primary mt-2">
              {categories.length}
            </p>
          </div>
        </div>

        {/* Active Categories */}
        <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-green/5 border border-v6-green/20 p-4 shadow-v6-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-v6-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-v6-green">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-v6-body font-medium">Active</span>
            </div>
            <p className="text-3xl font-v6-display font-bold text-v6-text-primary mt-2">
              {activeCount}
            </p>
          </div>
        </div>

        {/* Total Items */}
        <div className="relative overflow-hidden rounded-v6-card-sm bg-v6-secondary/5 border border-v6-secondary/20 p-4 shadow-v6-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-v6-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-v6-primary">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-sm font-v6-body font-medium">Total Items</span>
            </div>
            <p className="text-3xl font-v6-display font-bold text-v6-text-primary mt-2">
              {totalItems}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Categories Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-v6-surface-secondary rounded-v6-card-sm border border-v6-border">
            <AlertCircle className="h-12 w-12 text-v6-text-muted mx-auto mb-4" />
            <h2 className="text-lg font-v6-display font-medium text-v6-text-primary mb-2">
              No categories yet
            </h2>
            <p className="font-v6-body text-v6-text-secondary">
              Add your first category to start organizing menu items
            </p>
          </div>
        ) : (
          <div className="rounded-v6-card-sm border border-v6-border bg-v6-surface-primary overflow-hidden shadow-v6-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-v6-surface-secondary hover:bg-v6-surface-secondary">
                  <TableHead className="w-[80px] font-v6-body font-medium text-v6-text-secondary">
                    Order
                  </TableHead>
                  <TableHead className="font-v6-body font-medium text-v6-text-secondary">
                    Name
                  </TableHead>
                  <TableHead className="font-v6-body font-medium text-v6-text-secondary">
                    Slug
                  </TableHead>
                  <TableHead className="text-center font-v6-body font-medium text-v6-text-secondary">
                    Items
                  </TableHead>
                  <TableHead className="text-center font-v6-body font-medium text-v6-text-secondary">
                    Status
                  </TableHead>
                  <TableHead className="w-[100px] font-v6-body font-medium text-v6-text-secondary">
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
                        "hover:bg-v6-surface-secondary/50 transition-colors duration-v6-fast",
                        !category.is_active && "opacity-50",
                        isUpdating && "opacity-70"
                      )}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-v6-surface-tertiary"
                            onClick={() => handleMove(category, "up")}
                            disabled={isFirst || isUpdating}
                          >
                            <ChevronUp className="h-4 w-4 text-v6-text-secondary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-v6-surface-tertiary"
                            onClick={() => handleMove(category, "down")}
                            disabled={isLast || isUpdating}
                          >
                            <ChevronDown className="h-4 w-4 text-v6-text-secondary" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-v6-body font-medium text-v6-text-primary">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-v6-surface-tertiary px-2 py-1 rounded-v6-input font-mono text-v6-text-secondary">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="border-v6-border text-v6-text-secondary font-v6-body"
                        >
                          {category.item_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(category)}
                          disabled={isUpdating}
                          className="p-1 hover:bg-transparent"
                        >
                          {category.is_active ? (
                            <ToggleRight className="h-6 w-6 text-v6-green" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-v6-text-muted" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={isUpdating || category.item_count > 0}
                          className={cn(
                            "p-1 hover:bg-v6-status-error/10",
                            category.item_count > 0 &&
                              "opacity-30 cursor-not-allowed"
                          )}
                          title={
                            category.item_count > 0
                              ? "Cannot delete: has menu items"
                              : "Delete category"
                          }
                        >
                          <Trash2 className="h-4 w-4 text-v6-status-error" />
                        </Button>
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
