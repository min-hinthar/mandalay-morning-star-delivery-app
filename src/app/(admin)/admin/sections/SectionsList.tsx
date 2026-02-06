'use client';

import { m, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SectionCard,
  type SectionCardSection,
} from "@/components/ui/admin/sections/SectionCard";
import {
  ItemSelector,
  type SelectableItem,
} from "@/components/ui/admin/sections/ItemSelector";

interface Section extends Omit<SectionCardSection, "items"> {
  items: (SelectableItem & { sortOrder: number })[];
  hasUnpublishedChanges?: boolean;
}

interface SectionsListProps {
  activeSections: Section[];
  deletedSections: Section[];
  expandedId: string | null;
  showDeleted: boolean;
  onEdit: (section: SectionCardSection) => void;
  onToggleVisibility: (section: SectionCardSection) => void;
  onDelete: (section: SectionCardSection) => void;
  onDuplicate: (section: SectionCardSection) => void;
  onRestore: (section: SectionCardSection) => void;
  onExpand: (section: SectionCardSection) => void;
  onReorder: (newOrder: Section[]) => void;
  onSetShowDeleted: (show: boolean) => void;
  onCreate: () => void;
  onItemsChange: (sectionId: string, items: SelectableItem[]) => void;
  onAddItems: (sectionId: string, itemIds: string[]) => Promise<void>;
  onRemoveItem: (sectionId: string, itemId: string) => Promise<void>;
  onReorderItems: (sectionId: string, itemIds: string[]) => Promise<void>;
}

export type { Section as SectionsListSection };

export function SectionsList({
  activeSections,
  deletedSections,
  expandedId,
  showDeleted,
  onEdit,
  onToggleVisibility,
  onDelete,
  onDuplicate,
  onRestore,
  onExpand,
  onReorder,
  onSetShowDeleted,
  onCreate,
  onItemsChange,
  onAddItems,
  onRemoveItem,
  onReorderItems,
}: SectionsListProps) {
  return (
    <>
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
              onClick={onCreate}
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
            onReorder={onReorder}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {activeSections.map((section) => (
                <Reorder.Item key={section.id} value={section}>
                  <div className="space-y-2">
                    <SectionCard
                      section={section}
                      onEdit={onEdit}
                      onToggleVisibility={onToggleVisibility}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onRestore={onRestore}
                      onExpand={onExpand}
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
                            onItemsChange={(items) => onItemsChange(section.id, items)}
                            onAddItems={(itemIds) => onAddItems(section.id, itemIds)}
                            onRemoveItem={(itemId) => onRemoveItem(section.id, itemId)}
                            onReorderItems={(itemIds) => onReorderItems(section.id, itemIds)}
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
            onClick={() => onSetShowDeleted(!showDeleted)}
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
                      onEdit={onEdit}
                      onToggleVisibility={onToggleVisibility}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onRestore={onRestore}
                      onExpand={onExpand}
                    />
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </>
  );
}
