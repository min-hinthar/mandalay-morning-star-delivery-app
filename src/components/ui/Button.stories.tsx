import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShoppingCart, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "./button";

/**
 * V5 Button System
 *
 * High contrast design with bold interactive colors.
 * Features continuous subtle shimmer on primary CTAs.
 *
 * Sizes: sm (32px), md (40px), lg (48px), xl (56px - driver)
 * Variants: primary, secondary, ghost, danger, outline, link, success
 */
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "success", "outline", "link"],
      description: "Visual style of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "icon", "icon-sm", "icon-lg"],
      description: "Size of the button",
    },
    isLoading: {
      control: "boolean",
      description: "Show loading spinner",
    },
    disabled: {
      control: "boolean",
      description: "Disable the button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary variants
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Add to Cart",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "View Details",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Cancel",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete Item",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Confirm Order",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Learn More",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "View Menu",
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    children: "Driver Action",
  },
  parameters: {
    docs: {
      description: {
        story: "Extra large size for driver interface with 48px minimum touch target",
      },
    },
  },
};

// With Icons
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <ShoppingCart className="h-4 w-4" />,
    children: "Add to Cart",
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: "Continue",
  },
};

export const WithBothIcons: Story = {
  args: {
    leftIcon: <Plus className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: "Add Item",
  },
};

// Icon Only
export const IconOnly: Story = {
  args: {
    size: "icon",
    "aria-label": "Delete item",
    children: <Trash2 className="h-5 w-5" />,
  },
};

export const IconOnlySmall: Story = {
  args: {
    size: "icon-sm",
    "aria-label": "Add item",
    children: <Plus className="h-4 w-4" />,
  },
};

// States
export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Processing...",
  },
};

export const LoadingWithText: Story = {
  args: {
    isLoading: true,
    loadingText: "Placing Order...",
    children: "Place Order",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Unavailable",
  },
};

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
};

// All Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};
