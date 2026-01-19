import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

/**
 * V5 Badge Component
 *
 * Semantic variants using V5 design tokens for menu items, status, pricing, and allergens.
 */
const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "outline",
        "featured",
        "allergen",
        "price-discount",
        "price-premium",
        "status-success",
        "status-warning",
        "status-error",
        "status-info",
      ],
      description: "Visual style of the badge",
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Size of the badge",
    },
    showIcon: {
      control: "boolean",
      description: "Show variant-specific icon",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Default variants
export const Default: Story = {
  args: {
    children: "New",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Category",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "v5.0",
  },
};

// Menu-specific variants
export const Featured: Story = {
  args: {
    variant: "featured",
    showIcon: true,
    children: "Popular",
  },
  parameters: {
    docs: {
      description: {
        story: "Gold badge for featured/popular menu items",
      },
    },
  },
};

export const Allergen: Story = {
  args: {
    variant: "allergen",
    showIcon: true,
    children: "Contains Peanuts",
  },
  parameters: {
    docs: {
      description: {
        story: "Amber warning badge for allergen information",
      },
    },
  },
};

// Price modifiers
export const PriceDiscount: Story = {
  args: {
    variant: "price-discount",
    showIcon: true,
    children: "-$2.00",
  },
  parameters: {
    docs: {
      description: {
        story: "Green badge for price discounts",
      },
    },
  },
};

export const PricePremium: Story = {
  args: {
    variant: "price-premium",
    showIcon: true,
    children: "+$3.00",
  },
  parameters: {
    docs: {
      description: {
        story: "Red badge for price surcharges",
      },
    },
  },
};

// Status variants
export const StatusSuccess: Story = {
  args: {
    variant: "status-success",
    showIcon: true,
    children: "Delivered",
  },
};

export const StatusWarning: Story = {
  args: {
    variant: "status-warning",
    showIcon: true,
    children: "Preparing",
  },
};

export const StatusError: Story = {
  args: {
    variant: "status-error",
    showIcon: true,
    children: "Cancelled",
  },
};

export const StatusInfo: Story = {
  args: {
    variant: "status-info",
    showIcon: true,
    children: "In Transit",
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Badge",
  },
};

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="featured" showIcon>
        Popular
      </Badge>
      <Badge variant="allergen" showIcon>
        Allergen
      </Badge>
      <Badge variant="price-discount" showIcon>
        -$2.00
      </Badge>
      <Badge variant="price-premium" showIcon>
        +$3.00
      </Badge>
    </div>
  ),
};

// Status Variants
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="status-success" showIcon>
        Success
      </Badge>
      <Badge variant="status-warning" showIcon>
        Warning
      </Badge>
      <Badge variant="status-error" showIcon>
        Error
      </Badge>
      <Badge variant="status-info" showIcon>
        Info
      </Badge>
    </div>
  ),
};

// Menu Item Example
export const MenuItemBadges: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-[var(--color-surface-primary)]">
      <div className="font-semibold text-lg">Mohinga (Fish Noodle Soup)</div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="featured" showIcon>
          Popular
        </Badge>
        <Badge variant="allergen" showIcon>
          Fish
        </Badge>
        <Badge variant="price-discount" showIcon>
          Weekend Special
        </Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of badges used on a menu item",
      },
    },
  },
};
