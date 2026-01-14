import {
  Egg,
  Fish,
  Shell,
  Wheat,
  Milk,
  Nut,
  type LucideIcon,
} from "lucide-react";

export interface AllergenInfo {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const ALLERGEN_MAP: Record<string, AllergenInfo> = {
  egg: { label: "Egg", icon: Egg, color: "text-yellow-600" },
  fish: { label: "Fish", icon: Fish, color: "text-blue-600" },
  shellfish: { label: "Shellfish", icon: Shell, color: "text-orange-600" },
  gluten_wheat: { label: "Gluten", icon: Wheat, color: "text-amber-700" },
  dairy: { label: "Dairy", icon: Milk, color: "text-blue-400" },
  peanuts: { label: "Peanuts", icon: Nut, color: "text-amber-800" },
  tree_nuts: { label: "Tree Nuts", icon: Nut, color: "text-amber-600" },
  soy: { label: "Soy", icon: Wheat, color: "text-green-700" },
  sesame: { label: "Sesame", icon: Wheat, color: "text-yellow-800" },
};
