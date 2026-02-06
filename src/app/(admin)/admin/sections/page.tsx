"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  Eye,
  Package,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SectionCard,
  type SectionCardSection,
} from "@/components/ui/admin/sections/SectionCard";
import {
  SectionEditor,
  type SectionEditorSection,
} from "@/components/ui/admin/sections/SectionEditor";
import {
  ItemSelector,
  type SelectableItem,
} from "@/components/ui/admin/sections/ItemSelector";
import { DraftBanner } from "@/components/ui/admin/sections/DraftBanner";
import { HomepagePreview } from "@/components/ui/admin/sections/HomepagePreview";

interface Section extends Omit<SectionCardSection, "items"> {
  items: (SelectableItem & { sortOrder: number })[];
  hasUnpublishedChanges?: boolean;
}

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<SectionEditorSection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/sections");
      if (!response.ok) throw new Error("Failed to fetch sections");
      const data = await response.json();
      setSections(data);
    } catch {
      toast({ title: "Error", description: "Failed to fetch sections", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSections();
  };

  const handleCreateSection = () => {
    setEditingSection(null);
    setIsCreating(true);
  };

  const handleEditSection = (section: SectionCardSection) => {
    setEditingSection({
      id: section.id,
      name: section.name,
      subtitle: section.subtitle,
      icon: section.icon,
      accentColor: section.accentColor,
      itemCount: section.itemCount,
      isVisible: section.isVisible,
      isPredefined: section.isPredefined,
    });
    setIsCreating(true);
  };

  const handleSaveSection = async (data: Omit<SectionEditorSection, "id" | "isPredefined" | "updatedAt" | "updatedBy">) => {
    setIsSaving(true);
    try {
      const isEditing = !!editingSection?.id;
      const url = isEditing
        ? `/api/admin/sections/${editingSection.id}`
        : "/api/admin/sections";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save section");
      }

      toast({
        title: "Success",
        description: isEditing ? "Section updated" : "Section created",
      });

      setIsCreating(false);
      setEditingSection(null);
      fetchSections();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save section",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (section: SectionCardSection) => {
    // Optimistic update
    setSections((prev) =>
      prev.map((s) =>
        s.id === section.id ? { ...s, isVisible: !s.isVisible } : s
      )
    );

    try {
      const response = await fetch(`/api/admin/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      });

      if (!response.ok) throw new Error("Failed to update visibility");
    } catch {
      // Revert on error
      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id ? { ...s, isVisible: section.isVisible } : s
        )
      );
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const handleDeleteSection = async (section: SectionCardSection) => {
    const action = section.isPredefined ? "hide" : "delete";
    if (!confirm(`Are you sure you want to ${action} "${section.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/sections/${section.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(`Failed to ${action} section`);

      toast({ title: "Success", description: `Section ${action}d` });
      fetchSections();
    } catch {
      toast({ title: "Error", description: `Failed to ${action} section`, variant: "destructive" });
    }
  };

  const handleDuplicateSection = async (section: SectionCardSection) => {
    try {
      const response = await fetch(`/api/admin/sections/${section.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });

      if (!response.ok) throw new Error("Failed to duplicate section");

      toast({ title: "Success", description: "Section duplicated" });
      fetchSections();
    } catch {
      toast({ title: "Error", description: "Failed to duplicate section", variant: "destructive" });
    }
  };

  const handleRestoreSection = async (section: SectionCardSection) => {
    try {
      const response = await fetch(`/api/admin/sections/${section.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });

      if (!response.ok) throw new Error("Failed to restore section");

      toast({ title: "Success", description: "Section restored" });
      fetchSections();
    } catch {
      toast({ title: "Error", description: "Failed to restore section", variant: "destructive" });
    }
  };

  const handleExpand = (section: SectionCardSection) => {
    setExpandedId(expandedId === section.id ? null : section.id);
  };

  const handleReorderSections = async (newOrder: Section[]) => {
    const activeSections = newOrder.filter((s) => !s.deletedAt);
    const deletedSections = sections.filter((s) => s.deletedAt);

    // Optimistic update
    setSections([...activeSections, ...deletedSections]);

    try {
      const response = await fetch("/api/admin/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: activeSections.map((s) => s.id) }),
      });

      if (!response.ok) throw new Error("Failed to reorder sections");
    } catch {
      // Revert on error
      fetchSections();
      toast({ title: "Error", description: "Failed to reorder sections", variant: "destructive" });
    }
  };

  // Item management handlers
  const handleAddItems = async (sectionId: string, itemIds: string[]) => {
    const response = await fetch(`/api/admin/sections/${sectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add items");
    }

    const updatedItems = await response.json();

    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: updatedItems, actualItemCount: updatedItems.length }
          : s
      )
    );
  };

  const handleRemoveItem = async (sectionId: string, itemId: string) => {
    const response = await fetch(
      `/api/admin/sections/${sectionId}/items?itemId=${itemId}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove item");
    }

    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.filter((i) => i.id !== itemId),
              actualItemCount: (s.actualItemCount ?? s.items.length) - 1,
            }
          : s
      )
    );
  };

  const handleReorderItems = async (sectionId: string, itemIds: string[]) => {
    const response = await fetch(`/api/admin/sections/${sectionId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to reorder items");
    }
  };

  const handleItemsChange = (sectionId: string, items: SelectableItem[]) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: items.map((item, index) => ({ ...item, sortOrder: item.sortOrder ?? index })) }
          : s
      )
    );
  };

  // Filter sections
  const activeSections = sections.filter((s) => !s.deletedAt);
  const deletedSections = sections.filter((s) => s.deletedAt);

  // Stats
  const totalSections = activeSections.length;
  const visibleSections = activeSections.filter((s) => s.isVisible).length;
  const totalItems = activeSections.reduce(
    (sum, s) => sum + (s.actualItemCount ?? s.items?.length ?? 0),
    0
  );
  const hasUnpublishedChanges = sections.some((s) => s.hasUnpublishedChanges);

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
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-tertiary rounded-card-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* Left: Section management */}
      <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
        {/* Draft Banner */}
        <DraftBanner
          hasUnpublishedChanges={hasUnpublishedChanges}
          onPublishComplete={fetchSections}
        />

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
              Featured Sections
            </h1>
            <p className="font-body text-text-secondary mt-1">
              Manage homepage featured sections and their items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border hover:bg-surface-tertiary"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              onClick={handleCreateSection}
              className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Section
            </Button>
          </div>
        </m.div>

      {/* Stats Cards */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Sections */}
        <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <LayoutGrid className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Sections</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {totalSections}
            </p>
          </div>
        </div>

        {/* Visible Sections */}
        <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Visible</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {visibleSections}
              <span className="text-sm font-body font-normal text-text-muted ml-2">
                / {totalSections}
              </span>
            </p>
          </div>
        </div>

        {/* Total Items */}
        <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-secondary-hover">
              <Package className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Items</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {totalItems}
            </p>
          </div>
        </div>
      </m.div>

      {/* Sections List */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {activeSections.length === 0 ? (
          <div className="text-center py-16 bg-surface-secondary rounded-card-sm border border-border">
            <LayoutGrid className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-lg font-display font-medium text-text-primary mb-2">
              No custom sections yet
            </h2>
            <p className="font-body text-text-secondary mb-4">
              Create one to highlight dishes on your homepage.
            </p>
            <Button
              onClick={handleCreateSection}
              className="bg-primary hover:bg-primary-hover text-text-inverse"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Section
            </Button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={activeSections}
            onReorder={handleReorderSections}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {activeSections.map((section) => (
                <Reorder.Item key={section.id} value={section}>
                  <div className="space-y-2">
                    <SectionCard
                      section={section}
                      onEdit={handleEditSection}
                      onToggleVisibility={handleToggleVisibility}
                      onDelete={handleDeleteSection}
                      onDuplicate={handleDuplicateSection}
                      onRestore={handleRestoreSection}
                      onExpand={handleExpand}
                      isExpanded={expandedId === section.id}
                    />

                    {/* Item Selector (when expanded) */}
                    <AnimatePresence>
                      {expandedId === section.id && (
                        <m.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-8 p-4 border border-border rounded-card-sm bg-surface-secondary"
                        >
                          <ItemSelector
                            sectionId={section.id}
                            sectionSlug={section.slug}
                            currentItems={section.items || []}
                            onItemsChange={(items) => handleItemsChange(section.id, items)}
                            onAddItems={(itemIds) => handleAddItems(section.id, itemIds)}
                            onRemoveItem={(itemId) => handleRemoveItem(section.id, itemId)}
                            onReorderItems={(itemIds) => handleReorderItems(section.id, itemIds)}
                          />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </m.div>

      {/* Deleted Sections Panel */}
      {deletedSections.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border rounded-card-sm overflow-hidden"
        >
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="w-full flex items-center justify-between p-4 bg-surface-secondary hover:bg-surface-tertiary transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-text-muted" />
              <span className="font-body font-medium text-text-secondary">
                {deletedSections.length} deleted section{deletedSections.length !== 1 && "s"}
              </span>
              <Badge variant="outline" className="text-xs">
                30-day recovery
              </Badge>
            </div>
            {showDeleted ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          <AnimatePresence>
            {showDeleted && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border"
              >
                <div className="p-4 space-y-3">
                  {deletedSections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onEdit={handleEditSection}
                      onToggleVisibility={handleToggleVisibility}
                      onDelete={handleDeleteSection}
                      onDuplicate={handleDuplicateSection}
                      onRestore={handleRestoreSection}
                      onExpand={handleExpand}
                    />
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}

        {/* Section Editor Modal */}
        {isCreating && (
          <SectionEditor
            section={editingSection}
            onSave={handleSaveSection}
            onCancel={() => {
              setIsCreating(false);
              setEditingSection(null);
            }}
            isLoading={isSaving}
          />
        )}
      </div>

      {/* Right: Live preview (hidden on mobile/tablet) */}
      <div className="hidden xl:block w-[420px] border-l border-border shrink-0">
        <HomepagePreview />
      </div>
    </div>
  );
}
