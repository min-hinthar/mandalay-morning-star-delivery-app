import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { MenuAccordion } from "./MenuAccordion";
import type { MenuCategory, MenuItem } from "@/types/menu";

/**
 * V5 Menu Accordion Component
 *
 * Collapsible menu categories with smooth animations:
 * - Chevron rotates 180° on expand
 * - Item count badge always visible
 * - First category auto-expanded on load
 * - Smooth height animation (300ms ease-out)
 */
const meta: Meta<typeof MenuAccordion> = {
  title: "Menu/MenuAccordion",
  component: MenuAccordion,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    allowMultiple: {
      control: "boolean",
      description: "Allow multiple categories open at once",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MenuAccordion>;

// Sample menu data
const sampleCategories: MenuCategory[] = [
  {
    id: "cat-1",
    slug: "appetizers",
    name: "Appetizers",
    sortOrder: 1,
    items: [
      {
        id: "1",
        slug: "tea-leaf-salad",
        nameEn: "Tea Leaf Salad",
        nameMy: "လက်ဖက်သုပ်",
        descriptionEn: "Fermented tea leaves mixed with crispy beans, nuts, tomatoes, and sesame",
        basePriceCents: 800,
        imageUrl: "/placeholder.jpg",
        allergens: ["peanuts", "sesame"],
        tags: ["popular", "vegetarian"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "2",
        slug: "samosa",
        nameEn: "Samosa",
        nameMy: "ဆမိုဆာ",
        descriptionEn: "Crispy pastry filled with spiced potatoes and peas",
        basePriceCents: 600,
        imageUrl: "/placeholder.jpg",
        allergens: ["gluten"],
        tags: ["vegetarian"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "3",
        slug: "tofu-kyaw",
        nameEn: "Tofu Kyaw",
        nameMy: "တိုဟူးကျော်",
        descriptionEn: "Crispy fried tofu with tangy tamarind dipping sauce",
        basePriceCents: 500,
        imageUrl: "/placeholder.jpg",
        allergens: ["soy"],
        tags: ["vegan"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
    ],
  },
  {
    id: "cat-2",
    slug: "mains",
    name: "Main Dishes",
    sortOrder: 2,
    items: [
      {
        id: "4",
        slug: "mohinga",
        nameEn: "Mohinga",
        nameMy: "မုန့်ဟင်းခါး",
        descriptionEn: "Traditional fish noodle soup - Myanmar's national dish",
        basePriceCents: 1200,
        imageUrl: "/placeholder.jpg",
        allergens: ["fish", "gluten"],
        tags: ["featured", "popular"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "5",
        slug: "shan-noodles",
        nameEn: "Shan Noodles",
        nameMy: "ရှမ်းခေါက်ဆွဲ",
        descriptionEn: "Rice noodles with pickled mustard greens and chicken",
        basePriceCents: 1000,
        imageUrl: "/placeholder.jpg",
        allergens: [],
        tags: ["popular"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "6",
        slug: "chicken-curry",
        nameEn: "Chicken Curry",
        nameMy: "ကြက်သားဟင်း",
        descriptionEn: "Traditional Burmese chicken curry with potatoes",
        basePriceCents: 1100,
        imageUrl: "/placeholder.jpg",
        allergens: [],
        tags: [],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "7",
        slug: "pork-curry",
        nameEn: "Pork Curry",
        nameMy: "ဝက်သားဟင်း",
        descriptionEn: "Slow-cooked pork in aromatic Burmese curry",
        basePriceCents: 1200,
        imageUrl: "/placeholder.jpg",
        allergens: [],
        tags: [],
        isActive: true,
        isSoldOut: true,
        modifierGroups: [],
      },
    ],
  },
  {
    id: "cat-3",
    slug: "desserts",
    name: "Desserts",
    sortOrder: 3,
    items: [
      {
        id: "8",
        slug: "shwe-yin-aye",
        nameEn: "Shwe Yin Aye",
        nameMy: "ရွှေရင်အေး",
        descriptionEn: "Coconut jelly, sago, and agar in sweetened coconut milk",
        basePriceCents: 500,
        imageUrl: "/placeholder.jpg",
        allergens: [],
        tags: ["popular", "vegan"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "9",
        slug: "semolina-cake",
        nameEn: "Semolina Cake",
        nameMy: "ဆီမိုလီနာကိတ်",
        descriptionEn: "Traditional Burmese semolina cake with coconut",
        basePriceCents: 400,
        imageUrl: "/placeholder.jpg",
        allergens: ["gluten", "eggs"],
        tags: [],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
    ],
  },
  {
    id: "cat-4",
    slug: "drinks",
    name: "Drinks",
    sortOrder: 4,
    items: [
      {
        id: "10",
        slug: "burmese-milk-tea",
        nameEn: "Burmese Milk Tea",
        nameMy: "လက်ဖက်ရည်",
        descriptionEn: "Strong black tea with sweetened condensed milk",
        basePriceCents: 350,
        imageUrl: "/placeholder.jpg",
        allergens: ["dairy"],
        tags: ["popular"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
      {
        id: "11",
        slug: "fresh-lime-juice",
        nameEn: "Fresh Lime Juice",
        nameMy: "သံပုရာရည်",
        descriptionEn: "Freshly squeezed lime juice with honey",
        basePriceCents: 300,
        imageUrl: "/placeholder.jpg",
        allergens: [],
        tags: ["vegan"],
        isActive: true,
        isSoldOut: false,
        modifierGroups: [],
      },
    ],
  },
];

// Default
export const Default: Story = {
  render: () => {
    const AccordionDemo = () => {
      const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

      return (
        <div className="max-w-2xl">
          <MenuAccordion
            categories={sampleCategories}
            onItemClick={setSelectedItem}
          />
          {selectedItem && (
            <div className="mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Selected: <strong>{selectedItem.nameEn}</strong>
              </p>
            </div>
          )}
        </div>
      );
    };

    return <AccordionDemo />;
  },
};

// Single category expanded
export const SingleExpand: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion
        categories={sampleCategories}
        allowMultiple={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Only one category can be expanded at a time",
      },
    },
  },
};

// Multiple categories expanded
export const MultipleExpand: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion
        categories={sampleCategories}
        defaultExpanded={["appetizers", "mains"]}
        allowMultiple={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple categories can be expanded simultaneously",
      },
    },
  },
};

// All collapsed initially
export const AllCollapsed: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion
        categories={sampleCategories}
        defaultExpanded={[]}
      />
    </div>
  ),
};

// Custom item renderer
export const CustomItemRenderer: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion
        categories={sampleCategories}
        renderItem={(item) => (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--color-interactive-primary)]/5 to-transparent rounded-lg border border-[var(--color-interactive-primary)]/20">
            <div>
              <h4 className="font-bold text-[var(--color-text-primary)]">{item.nameEn}</h4>
              <p className="text-sm text-[var(--color-interactive-primary)]">
                ${(item.basePriceCents / 100).toFixed(2)}
              </p>
            </div>
            <button className="px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded-full text-sm font-medium">
              Add
            </button>
          </div>
        )}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom item rendering with the renderItem prop",
      },
    },
  },
};

// Empty categories
export const EmptyState: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion categories={[]} />
    </div>
  ),
};

// Single category
export const SingleCategory: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion categories={[sampleCategories[0]]} />
    </div>
  ),
};

// Mobile viewport
export const MobileView: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MenuAccordion categories={sampleCategories} />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile" },
  },
};
