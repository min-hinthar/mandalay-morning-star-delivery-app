'use client';

import { useState } from "react";
import { Plus, Loader2, FolderTree } from "lucide-react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AddCategoryDialogProps {
  onCategoryCreated: () => void;
}

export function AddCategoryDialog({ onCategoryCreated }: AddCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [creating, setCreating] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleCreate = async () => {
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

      toast({ title: "Created", description: `Category "${newCategory.name}" created successfully` });
      setNewCategory({ name: "", slug: "" });
      setOpen(false);
      onCategoryCreated();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-surface-primary border-border rounded-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-input bg-primary text-text-inverse">
              <FolderTree className="h-5 w-5" />
            </div>
            Add New Category
          </DialogTitle>
          <DialogDescription className="font-body text-text-secondary">
            Create a new menu category. Categories are used to organize
            menu items.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-body font-medium text-text-primary"
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
              className="bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="slug"
              className="text-sm font-body font-medium text-text-primary"
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
              className="bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input font-mono"
            />
            <p className="text-xs font-body text-text-muted">
              URL-friendly identifier. Lowercase, no spaces.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border hover:bg-surface-tertiary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
