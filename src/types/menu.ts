export type MenuCategory = "main" | "side" | "dessert" | "drink";

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  category: MenuCategory;
};
