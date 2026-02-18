"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence, Reorder } from "framer-motion";
import {
  Search,
  X,
  Check,
  GripVertical,
  Trash2,
  Plus,
  Utensils,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface SelectableItem {
  id: string;
  nameEn: string;
  nameMy?: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isActive?: boolean;
  isSoldOut?: boolean;
  sortOrder?: number;
  totalOrdered?: number; // For most-popular suggestions
}

interface ItemSelectorProps {
  sectionId: string;
  sectionSlug?: string;
  currentItems: SelectableItem[];
  onItemsChange: (items: SelectableItem[]) => void;
  onAddItems: (itemIds: string[]) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onReorderItems: (itemIds: string[]) => Promise<void>;
}

export function ItemSelector({
  sectionId: _sectionId,
  sectionSlug,
  currentItems,
  onItemsChange,
  onAddItems,
  onRemoveItem,
  onReorderItems,
}: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SelectableItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SelectableItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const isMostPopular = sectionSlug === "most-popular";
  const currentItemIds = new Set(currentItems.map((i) => i.id));

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/menu/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Transform from API format to our format
          const items: SelectableItem[] = (data.data?.items || []).map(
            (item: {
              id: string;
              nameEn: string;
              nameMy?: string | null;
              imageUrl: string | null;
              basePriceCents: number;
              isActive?: boolean;
              isSoldOut?: boolean;
            }) => ({
              id: item.id,
              nameEn: item.nameEn,
              nameMy: item.nameMy,
              imageUrl: item.imageUrl,
              basePriceCents: item.basePriceCents,
              isActive: item.isActive,
              isSoldOut: item.isSoldOut,
            })
          );
          setSearchResults(items);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load suggestions for Most Popular section
  const loadSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/admin/sections/most-popular/suggest");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.items || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedIds(newSelection);
  };

  const handleAddSelected = async () => {
    const itemsToAdd = Array.from(selectedIds).filter((id) => !currentItemIds.has(id));
    if (itemsToAdd.length === 0) return;

    setIsAdding(true);
    try {
      await onAddItems(itemsToAdd);
      setSelectedIds(new Set());
      setSearchQuery("");
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    await onRemoveItem(itemId);
  };

  const handleReorder = (newOrder: SelectableItem[]) => {
    onItemsChange(newOrder);
    onReorderItems(newOrder.map((i) => i.id));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Most Popular: Auto-suggest button */}
        {isMostPopular && (
          <Button
            variant="outline"
            onClick={loadSuggestions}
            disabled={isLoadingSuggestions}
            className="shrink-0"
          >
            {isLoadingSuggestions ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Auto-suggest
          </Button>
        )}

        {selectedIds.size > 0 && (
          <Button
            onClick={handleAddSelected}
            disabled={isAdding}
            className="bg-primary hover:bg-primary-hover text-text-inverse shrink-0"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Search Results / Suggestions */}
      <AnimatePresence mode="wait">
        {(searchResults.length > 0 || showSuggestions) && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-card-sm overflow-hidden"
          >
            <div className="p-2 bg-surface-secondary border-b border-border flex items-center justify-between">
              <span className="text-sm font-body font-medium text-text-secondary">
                {showSuggestions ? "Suggested Items" : "Search Results"}
              </span>
              {showSuggestions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="h-6 px-2 text-xs"
                >
                  Close
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {(showSuggestions ? suggestions : searchResults).map((item) => {
                const isInSection = currentItemIds.has(item.id);
                const isSelected = selectedIds.has(item.id);

                return (
                  <m.div
                    key={item.id}
                    layout
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                      isInSection && "bg-green/10",
                      isSelected && !isInSection && "bg-primary/10",
                      !isInSection && !isSelected && "hover:bg-surface-tertiary"
                    )}
                    onClick={() => !isInSection && toggleSelection(item.id)}
                  >
                    {/* Checkbox/Check */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded border-2 shrink-0",
                        isInSection && "bg-green border-green",
                        isSelected && !isInSection && "bg-primary border-primary",
                        !isInSection && !isSelected && "border-border"
                      )}
                    >
                      {(isInSection || isSelected) && (
                        <Check className="h-3 w-3 text-text-inverse" />
                      )}
                    </div>

                    {/* Image */}
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.nameEn}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-surface-tertiary flex items-center justify-center shrink-0">
                        <Utensils className="h-4 w-4 text-text-muted" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-text-primary truncate">
                        {item.nameEn}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-body text-primary">
                          {formatPrice(item.basePriceCents)}
                        </span>
                        {item.totalOrdered !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {item.totalOrdered} ordered
                          </Badge>
                        )}
                        {item.isSoldOut && (
                          <Badge
                            variant="outline"
                            className="text-xs border-status-error/30 text-status-error"
                          >
                            Sold Out
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Already added indicator */}
                    {isInSection && (
                      <Badge className="bg-green/20 text-green border-0 shrink-0">Added</Badge>
                    )}
                  </m.div>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      )}

      {/* Current Items (Reorderable) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-body font-medium text-text-secondary">
            Section Items ({currentItems.length})
          </h4>
        </div>

        {currentItems.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={currentItems}
            onReorder={handleReorder}
            className="space-y-1"
          >
            {currentItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="flex items-center gap-3 p-2 bg-surface-secondary rounded-md cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-text-muted shrink-0" />

                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.nameEn}
                    className="w-8 h-8 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-surface-tertiary flex items-center justify-center shrink-0">
                    <Utensils className="h-3 w-3 text-text-muted" />
                  </div>
                )}

                <span className="font-body text-sm text-text-primary flex-1 truncate">
                  {item.nameEn}
                </span>

                <span className="text-sm font-body text-primary shrink-0">
                  {formatPrice(item.basePriceCents)}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  className="p-1 text-text-muted hover:text-status-error shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="text-center py-8 bg-surface-secondary rounded-card-sm">
            <Utensils className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm font-body text-text-muted">
              No items yet. Search to add menu items.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
