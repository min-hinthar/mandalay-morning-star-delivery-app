'use client';

import { m } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MenuFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: Category[];
}

export function MenuFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: MenuFilterBarProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row gap-4"
    >
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === "all" ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all duration-fast font-body",
            selectedCategory === "all"
              ? "bg-primary hover:bg-primary-hover text-text-inverse border-transparent"
              : "bg-surface-primary border-border text-text-primary hover:bg-primary/10 hover:border-primary/30"
          )}
          onClick={() => onCategoryChange("all")}
        >
          All Categories
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all duration-fast font-body",
              selectedCategory === category.id
                ? "bg-primary hover:bg-primary-hover text-text-inverse border-transparent"
                : "bg-surface-primary border-border text-text-primary hover:bg-primary/10 hover:border-primary/30"
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Badge>
        ))}
      </div>
    </m.div>
  );
}
