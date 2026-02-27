"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { m } from "framer-motion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "@/lib/hooks/useToastV8";
import { Button } from "@/components/ui/button";
import { MenuItemFormFields, type MenuItemFormData } from "./MenuItemFormFields";
import { MenuItemPhotoSection } from "./MenuItemPhotoSection";

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
  updated_at: string;
  menu_categories?: {
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

export default function AdminMenuItemEditPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<MenuItemFormData>({
    name_en: "",
    name_my: "",
    description_en: "",
    base_price_cents: 0,
    category_id: "",
    is_active: true,
    is_sold_out: false,
    allergens: [],
    tags: [],
    image_url: null,
  });

  const fetchItem = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/menu/${itemId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({ message: "Menu item not found", type: "error" });
          router.push("/admin/menu");
          return;
        }
        throw new Error("Failed to fetch item");
      }

      const data: MenuItem = await response.json();
      setItem(data);
      setFormData({
        name_en: data.name_en,
        name_my: data.name_my || "",
        description_en: data.description_en || "",
        base_price_cents: data.base_price_cents,
        category_id: data.category_id,
        is_active: data.is_active,
        is_sold_out: data.is_sold_out,
        allergens: data.allergens || [],
        tags: data.tags || [],
        image_url: data.image_url,
      });
    } catch {
      toast({ message: "Failed to fetch menu item", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [itemId, router]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu");
      if (!response.ok) return;

      const items: MenuItem[] = await response.json();
      const uniqueCategories = items.reduce((acc: Category[], item) => {
        if (item.menu_categories && !acc.find((c) => c.id === item.menu_categories!.id)) {
          acc.push(item.menu_categories);
        }
        return acc;
      }, []);
      setCategories(uniqueCategories);
    } catch {
      // Silently fail - categories are optional enhancement
    }
  }, []);

  useEffect(() => {
    fetchItem();
    fetchCategories();
  }, [fetchItem, fetchCategories]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/menu/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_en: formData.name_en,
          name_my: formData.name_my || null,
          description_en: formData.description_en || null,
          base_price_cents: formData.base_price_cents,
          category_id: formData.category_id,
          is_active: formData.is_active,
          is_sold_out: formData.is_sold_out,
          allergens: formData.allergens,
          tags: formData.tags,
          image_url: formData.image_url,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      toast({ message: "Menu item updated", type: "success" });
      fetchItem(); // Refresh to get updated_at
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to save",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (url: string | null) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-surface-tertiary rounded-input" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-10 bg-surface-tertiary rounded-input" />
              <div className="h-10 bg-surface-tertiary rounded-input" />
              <div className="h-24 bg-surface-tertiary rounded-input" />
            </div>
            <div className="h-64 bg-surface-tertiary rounded-card-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Menu item not found</p>
        <Button variant="outline" onClick={() => router.push("/admin/menu")} className="mt-4">
          Back to Menu
        </Button>
      </div>
    );
  }

  const initialDriveUrl = item.image_url?.includes("drive.google.com") ? item.image_url : "";
  const initialDrivePreview = item.image_url?.includes("drive.google.com") ? item.image_url : null;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/menu")}
            className="hover:bg-surface-tertiary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary">
              Edit Menu Item
            </h1>
            <p className="font-body text-text-secondary text-sm mt-0.5">{item.name_en}</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-text-inverse"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MenuItemFormFields
          formData={formData}
          categories={categories}
          onFormDataChange={setFormData}
        />
        <MenuItemPhotoSection
          key={item.updated_at}
          imageUrl={formData.image_url}
          nameEn={formData.name_en}
          itemId={itemId}
          updatedAt={item.updated_at}
          initialDriveUrl={initialDriveUrl}
          initialDrivePreview={initialDrivePreview}
          onImageChange={handleImageChange}
        />
      </div>
    </div>
  );
}
