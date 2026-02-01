"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PhotoUploadZone } from "@/components/ui/admin/photos/PhotoUploadZone";
import type { UploadResult } from "@/lib/supabase/storage";

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


const ALLERGEN_OPTIONS = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Peanuts",
  "Shellfish",
  "Soy",
  "Eggs",
  "Fish",
  "Sesame",
];

export default function AdminMenuItemEditPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [verifyingDrive, setVerifyingDrive] = useState(false);
  const [drivePreview, setDrivePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name_en: "",
    name_my: "",
    description_en: "",
    base_price_cents: 0,
    category_id: "",
    is_active: true,
    is_sold_out: false,
    allergens: [] as string[],
    tags: [] as string[],
    image_url: null as string | null,
  });

  const fetchItem = useCallback(async () => {
    try {
      // Fetch item details
      const response = await fetch(`/api/admin/menu/${itemId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({ title: "Error", description: "Menu item not found", variant: "destructive" });
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
      // Pre-populate Drive URL if current image is from Google Drive
      if (data.image_url && data.image_url.includes("drive.google.com")) {
        setDriveUrl(data.image_url);
        setDrivePreview(data.image_url);
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch menu item", variant: "destructive" });
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

      toast({ title: "Success", description: "Menu item updated" });
      fetchItem(); // Refresh to get updated_at
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUploadComplete = (results: UploadResult[]) => {
    if (results.length > 0) {
      setFormData((prev) => ({ ...prev, image_url: results[0].publicUrl }));
      toast({ title: "Photo uploaded", description: "Save to apply changes" });
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, image_url: null }));
  };

  const handleVerifyDriveUrl = async () => {
    if (!driveUrl) return;

    setVerifyingDrive(true);
    setDrivePreview(null);

    try {
      // Extract the file ID from various Google Drive URL formats
      let fileId = "";
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /open\?id=([a-zA-Z0-9_-]+)/,
      ];

      for (const pattern of patterns) {
        const match = driveUrl.match(pattern);
        if (match) {
          fileId = match[1];
          break;
        }
      }

      if (!fileId) {
        throw new Error("Invalid Google Drive URL format");
      }

      // Construct URL for verification (API will return optimized previewUrl)
      const driveUrlForVerify = `https://drive.google.com/file/d/${fileId}/view`;

      // Verify URL is accessible via API - returns optimized thumbnail URL
      const response = await fetch("/api/admin/photos/verify-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: driveUrlForVerify }),
      });

      const verifyData = await response.json();

      if (!response.ok || !verifyData.valid) {
        throw new Error(verifyData.error || "URL not accessible");
      }

      // Use the API's returned previewUrl (thumbnail format for reliability)
      const imageUrl = verifyData.previewUrl;
      setDrivePreview(imageUrl);
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      toast({ title: "URL verified", description: "Image is accessible. Save to apply." });
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Could not verify URL",
        variant: "destructive",
      });
    } finally {
      setVerifyingDrive(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Button
          variant="outline"
          onClick={() => router.push("/admin/menu")}
          className="mt-4"
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
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
            <p className="font-body text-text-secondary text-sm mt-0.5">
              {item.name_en}
            </p>
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-text-primary">Basic Info</h2>

            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-text-secondary">
                Name (English) *
              </label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
                className="bg-surface-primary border-border"
                placeholder="Enter item name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-text-secondary">
                Name (Myanmar)
              </label>
              <Input
                value={formData.name_my}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_my: e.target.value }))}
                className="bg-surface-primary border-border"
                placeholder="Enter Myanmar name (optional)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-text-secondary">
                Description
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, description_en: e.target.value }))}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-input",
                  "bg-surface-primary border border-border",
                  "font-body text-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-text-secondary">
                Price (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={(formData.base_price_cents / 100).toFixed(2)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    base_price_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                  }))
                }
                className="bg-surface-primary border-border"
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-body font-medium text-text-secondary">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 rounded-input",
                    "bg-surface-primary border border-border",
                    "font-body text-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-text-primary">Status</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-body font-medium text-text-primary">Active</p>
                <p className="text-sm font-body text-text-muted">Show item on menu</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  formData.is_active ? "bg-green" : "bg-surface-tertiary"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-surface-primary transition-transform",
                    formData.is_active ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-body font-medium text-text-primary">Sold Out</p>
                <p className="text-sm font-body text-text-muted">Mark as unavailable</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_sold_out: !prev.is_sold_out }))}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  formData.is_sold_out ? "bg-secondary" : "bg-surface-tertiary"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-surface-primary transition-transform",
                    formData.is_sold_out ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Allergens */}
          <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-text-primary">Allergens</h2>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <Badge
                  key={allergen}
                  variant={formData.allergens.includes(allergen) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    formData.allergens.includes(allergen)
                      ? "bg-primary text-text-inverse"
                      : "bg-surface-primary border-border hover:bg-primary/10"
                  )}
                  onClick={() => toggleAllergen(allergen)}
                >
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Photo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photo
            </h2>

            {/* Current photo preview */}
            {formData.image_url ? (
              <div className="relative">
                <div className="relative w-full aspect-square max-w-xs mx-auto rounded-card-sm overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image_url}
                    alt={formData.name_en}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 bg-surface-inverse/60 hover:bg-surface-inverse/80 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-text-inverse" />
                  </button>
                </div>
                <p className="text-xs font-body text-text-muted text-center mt-2">
                  Current photo
                </p>
              </div>
            ) : (
              <div className="w-full aspect-square max-w-xs mx-auto rounded-card-sm border-2 border-dashed border-border flex flex-col items-center justify-center bg-surface-tertiary/50">
                <ImageIcon className="h-12 w-12 text-text-muted mb-2" />
                <span className="text-sm font-body text-text-muted">No photo</span>
              </div>
            )}

            {/* Upload new photo */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-body font-medium text-text-secondary mb-3">
                Upload new photo
              </p>
              <PhotoUploadZone
                menuItemId={itemId}
                onUploadComplete={handlePhotoUploadComplete}
                className="!p-4"
              />
            </div>

            {/* Google Drive URL */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-body font-medium text-text-secondary mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Or use Google Drive URL
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste Google Drive share link..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="bg-surface-primary border-border flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleVerifyDriveUrl}
                  disabled={!driveUrl || verifyingDrive}
                  className="shrink-0"
                >
                  {verifyingDrive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {drivePreview && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={drivePreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-input object-cover border border-green"
                  />
                  <p className="text-xs text-green mt-1">
                    {formData.image_url === drivePreview ? "Current saved URL" : "URL verified - Save to apply"}
                  </p>
                </div>
              )}
              {/* Show full URL for reference */}
              {formData.image_url && formData.image_url.includes("drive.google.com") && (
                <div className="mt-2">
                  <p className="text-xs text-text-muted break-all bg-surface-tertiary p-2 rounded-input">
                    {formData.image_url}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated Info */}
          <div className="bg-surface-secondary rounded-card-sm border border-border p-6">
            <h2 className="font-display font-semibold text-text-primary mb-4">History</h2>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-text-muted" />
              <span className="font-body text-text-secondary">
                Last updated: {formatDateTime(item.updated_at)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
