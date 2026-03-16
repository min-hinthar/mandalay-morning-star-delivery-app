"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import { type SectionCardSection } from "@/components/ui/admin/sections/SectionCard";
import {
  SectionEditor,
  type SectionEditorSection,
} from "@/components/ui/admin/sections/SectionEditor";
import { type SelectableItem } from "@/components/ui/admin/sections/ItemSelector";
import { HomepagePreview } from "@/components/ui/admin/sections/HomepagePreview";
import { SectionsToolbar } from "./SectionsToolbar";
import { SectionsList, type SectionsListSection } from "./SectionsList";

type Section = SectionsListSection;

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
      toast({ message: "Failed to fetch sections", type: "error" });
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

  const handleSaveSection = async (
    data: Omit<SectionEditorSection, "id" | "isPredefined" | "updatedAt" | "updatedBy">
  ) => {
    setIsSaving(true);
    try {
      const isEditing = !!editingSection?.id;
      const url = isEditing ? `/api/admin/sections/${editingSection.id}` : "/api/admin/sections";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(extractErrorMessage(error, "Failed to save section"));
      }

      toast({
        message: isEditing ? "Section updated" : "Section created",
        type: "success",
      });

      setIsCreating(false);
      setEditingSection(null);
      fetchSections();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to save section",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (section: SectionCardSection) => {
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, isVisible: !s.isVisible } : s))
    );

    try {
      const response = await fetch(`/api/admin/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      });

      if (!response.ok) throw new Error("Failed to update visibility");
    } catch {
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, isVisible: section.isVisible } : s))
      );
      toast({ message: "Failed to update visibility", type: "error" });
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

      toast({ message: `Section ${action}d`, type: "success" });
      fetchSections();
    } catch {
      toast({ message: `Failed to ${action} section`, type: "error" });
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

      toast({ message: "Section duplicated", type: "success" });
      fetchSections();
    } catch {
      toast({ message: "Failed to duplicate section", type: "error" });
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

      toast({ message: "Section restored", type: "success" });
      fetchSections();
    } catch {
      toast({ message: "Failed to restore section", type: "error" });
    }
  };

  const handleExpand = (section: SectionCardSection) => {
    setExpandedId(expandedId === section.id ? null : section.id);
  };

  const handleReorderSections = async (newOrder: Section[]) => {
    const activeSects = newOrder.filter((s) => !s.deletedAt);
    const deletedSects = sections.filter((s) => s.deletedAt);

    setSections([...activeSects, ...deletedSects]);

    try {
      const response = await fetch("/api/admin/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: activeSects.map((s) => s.id) }),
      });

      if (!response.ok) throw new Error("Failed to reorder sections");
    } catch {
      fetchSections();
      toast({ message: "Failed to reorder sections", type: "error" });
    }
  };

  const handleAddItems = async (sectionId: string, itemIds: string[]) => {
    const response = await fetch(`/api/admin/sections/${sectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, "Failed to add items"));
    }

    const updatedItems = await response.json();

    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, items: updatedItems, actualItemCount: updatedItems.length } : s
      )
    );
  };

  const handleRemoveItem = async (sectionId: string, itemId: string) => {
    const response = await fetch(`/api/admin/sections/${sectionId}/items?itemId=${itemId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, "Failed to remove item"));
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
          ? {
              ...s,
              items: items.map((item, index) => ({ ...item, sortOrder: item.sortOrder ?? index })),
            }
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
      <div className="flex-1 p-4 md:p-8 space-y-6">
        <SectionsToolbar
          hasUnpublishedChanges={hasUnpublishedChanges}
          refreshing={refreshing}
          totalSections={totalSections}
          visibleSections={visibleSections}
          totalItems={totalItems}
          onRefresh={handleRefresh}
          onCreate={handleCreateSection}
          onPublishComplete={fetchSections}
        />

        <SectionsList
          activeSections={activeSections}
          deletedSections={deletedSections}
          expandedId={expandedId}
          showDeleted={showDeleted}
          onEdit={handleEditSection}
          onToggleVisibility={handleToggleVisibility}
          onDelete={handleDeleteSection}
          onDuplicate={handleDuplicateSection}
          onRestore={handleRestoreSection}
          onExpand={handleExpand}
          onReorder={handleReorderSections}
          onSetShowDeleted={setShowDeleted}
          onCreate={handleCreateSection}
          onItemsChange={handleItemsChange}
          onAddItems={handleAddItems}
          onRemoveItem={handleRemoveItem}
          onReorderItems={handleReorderItems}
        />

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
