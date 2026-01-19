import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Home, Utensils, ShoppingCart, User, Truck } from "lucide-react";
import { TabSwitcher, TabList, useTabState, type Tab } from "./TabSwitcher";

/**
 * V5 TabSwitcher Component
 *
 * Animated tab component with direction-aware content transitions.
 * Supports underline and pill variants with full accessibility.
 *
 * Features:
 * - Direction-aware slide animations
 * - Mobile swipe navigation
 * - Horizontal scroll with edge fades
 * - Keyboard navigation (arrow keys)
 * - ARIA tablist/tab/tabpanel roles
 */
const meta: Meta<typeof TabSwitcher> = {
  title: "UI/TabSwitcher",
  component: TabSwitcher,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["underline", "pill"],
      description: "Visual style of the tabs",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the tabs",
    },
    lazy: {
      control: "boolean",
      description: "Only render active tab content",
    },
    swipeEnabled: {
      control: "boolean",
      description: "Enable swipe navigation on mobile",
    },
    sticky: {
      control: "boolean",
      description: "Sticky tab list on scroll",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TabSwitcher>;

// Sample tabs for demos
const sampleTabs: Tab[] = [
  {
    id: "appetizers",
    label: "Appetizers",
    content: (
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">Appetizers</h3>
        <p className="text-[var(--color-text-secondary)]">
          Traditional Burmese starters including samosas, spring rolls, and tea leaf salad.
        </p>
        <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg">
          <p className="font-medium">Tea Leaf Salad</p>
          <p className="text-sm text-[var(--color-text-secondary)]">$8.00</p>
        </div>
      </div>
    ),
  },
  {
    id: "mains",
    label: "Main Dishes",
    content: (
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">Main Dishes</h3>
        <p className="text-[var(--color-text-secondary)]">
          Signature dishes including Mohinga, curries, and noodle dishes.
        </p>
        <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg">
          <p className="font-medium">Mohinga (Fish Noodle Soup)</p>
          <p className="text-sm text-[var(--color-text-secondary)]">$12.00</p>
        </div>
      </div>
    ),
  },
  {
    id: "desserts",
    label: "Desserts",
    content: (
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">Desserts</h3>
        <p className="text-[var(--color-text-secondary)]">
          Sweet treats including shwe yin aye and semolina cake.
        </p>
        <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg">
          <p className="font-medium">Shwe Yin Aye</p>
          <p className="text-sm text-[var(--color-text-secondary)]">$5.00</p>
        </div>
      </div>
    ),
  },
  {
    id: "drinks",
    label: "Drinks",
    content: (
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">Drinks</h3>
        <p className="text-[var(--color-text-secondary)]">
          Burmese tea, fresh juices, and specialty beverages.
        </p>
        <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg">
          <p className="font-medium">Burmese Milk Tea</p>
          <p className="text-sm text-[var(--color-text-secondary)]">$3.50</p>
        </div>
      </div>
    ),
  },
];

// Wrapper for controlled tabs
function TabsDemo({
  variant = "underline",
  size = "md",
  ...props
}: Partial<React.ComponentProps<typeof TabSwitcher>>) {
  const { activeTab, setActiveTab } = useTabState({ defaultTab: "appetizers" });

  return (
    <div className="w-full max-w-lg">
      <TabSwitcher
        tabs={sampleTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
        size={size}
        {...props}
      />
    </div>
  );
}

// Default (Underline)
export const Default: Story = {
  render: () => <TabsDemo />,
};

// Pill variant
export const PillVariant: Story = {
  render: () => <TabsDemo variant="pill" />,
  parameters: {
    docs: {
      description: {
        story: "Pill variant with animated background indicator",
      },
    },
  },
};

// Sizes
export const Small: Story = {
  render: () => <TabsDemo size="sm" />,
};

export const Large: Story = {
  render: () => <TabsDemo size="lg" />,
};

// With Icons
function TabsWithIcons() {
  const { activeTab, setActiveTab } = useTabState({ defaultTab: "home" });

  const iconTabs: Tab[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="h-4 w-4" />,
      content: <div className="p-4">Home content</div>,
    },
    {
      id: "menu",
      label: "Menu",
      icon: <Utensils className="h-4 w-4" />,
      content: <div className="p-4">Menu content</div>,
    },
    {
      id: "cart",
      label: "Cart",
      icon: <ShoppingCart className="h-4 w-4" />,
      content: <div className="p-4">Cart content</div>,
    },
    {
      id: "orders",
      label: "Orders",
      icon: <Truck className="h-4 w-4" />,
      content: <div className="p-4">Orders content</div>,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      content: <div className="p-4">Profile content</div>,
    },
  ];

  return (
    <div className="w-full max-w-lg">
      <TabSwitcher
        tabs={iconTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />
    </div>
  );
}

export const WithIcons: Story = {
  render: () => <TabsWithIcons />,
};

// With Disabled Tab
function TabsWithDisabled() {
  const { activeTab, setActiveTab } = useTabState({ defaultTab: "available" });

  const tabs: Tab[] = [
    {
      id: "available",
      label: "Available",
      content: <div className="p-4">These items are currently available.</div>,
    },
    {
      id: "specials",
      label: "Daily Specials",
      content: <div className="p-4">Today&apos;s specials.</div>,
    },
    {
      id: "soldout",
      label: "Sold Out",
      disabled: true,
      content: <div className="p-4">Sold out items.</div>,
    },
  ];

  return (
    <div className="w-full max-w-lg">
      <TabSwitcher
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />
    </div>
  );
}

export const WithDisabledTab: Story = {
  render: () => <TabsWithDisabled />,
  parameters: {
    docs: {
      description: {
        story: "Tabs can be disabled to prevent selection",
      },
    },
  },
};

// Scrollable (many tabs)
function ScrollableTabs() {
  const { activeTab, setActiveTab } = useTabState({ defaultTab: "tab1" });

  const manyTabs: Tab[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `tab${i + 1}`,
    label: `Category ${i + 1}`,
    content: (
      <div className="p-4">
        <h3 className="font-semibold">Category {i + 1}</h3>
        <p className="text-[var(--color-text-secondary)]">
          Content for category {i + 1}
        </p>
      </div>
    ),
  }));

  return (
    <div className="w-full max-w-md">
      <TabSwitcher
        tabs={manyTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />
    </div>
  );
}

export const Scrollable: Story = {
  render: () => <ScrollableTabs />,
  parameters: {
    docs: {
      description: {
        story: "Tabs scroll horizontally when there are many options. Edge fades indicate more content.",
      },
    },
  },
};

// Pill with Icons
function PillTabsWithIcons() {
  const { activeTab, setActiveTab } = useTabState({ defaultTab: "active" });

  const statusTabs: Tab[] = [
    {
      id: "active",
      label: "Active",
      icon: <span className="h-2 w-2 rounded-full bg-green-500" />,
      content: <div className="p-4">5 active orders</div>,
    },
    {
      id: "preparing",
      label: "Preparing",
      icon: <span className="h-2 w-2 rounded-full bg-yellow-500" />,
      content: <div className="p-4">3 orders being prepared</div>,
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: <span className="h-2 w-2 rounded-full bg-blue-500" />,
      content: <div className="p-4">12 delivered today</div>,
    },
  ];

  return (
    <div className="w-full max-w-lg">
      <TabSwitcher
        tabs={statusTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pill"
      />
    </div>
  );
}

export const PillWithStatusIcons: Story = {
  render: () => <PillTabsWithIcons />,
};

// TabList only (standalone)
function TabListDemo() {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="w-full max-w-lg space-y-4">
      <TabList
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">
        <p className="font-medium">Selected: {activeTab}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          TabList renders only the tab buttons without content panels.
          Useful when content is rendered elsewhere.
        </p>
      </div>
    </div>
  );
}

export const TabListOnly: Story = {
  render: () => <TabListDemo />,
  parameters: {
    docs: {
      description: {
        story: "Standalone tab list without content panels - useful when content is rendered separately",
      },
    },
  },
};

// All Variants
export const AllVariants: Story = {
  render: () => {
    const UnderlineDemo = () => {
      const { activeTab, setActiveTab } = useTabState({ defaultTab: "tab1" });
      const tabs: Tab[] = [
        { id: "tab1", label: "First", content: <div className="p-4">First tab</div> },
        { id: "tab2", label: "Second", content: <div className="p-4">Second tab</div> },
        { id: "tab3", label: "Third", content: <div className="p-4">Third tab</div> },
      ];
      return (
        <TabSwitcher
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      );
    };

    const PillDemo = () => {
      const { activeTab, setActiveTab } = useTabState({ defaultTab: "tab1" });
      const tabs: Tab[] = [
        { id: "tab1", label: "First", content: <div className="p-4">First tab</div> },
        { id: "tab2", label: "Second", content: <div className="p-4">Second tab</div> },
        { id: "tab3", label: "Third", content: <div className="p-4">Third tab</div> },
      ];
      return (
        <TabSwitcher
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pill"
        />
      );
    };

    return (
      <div className="space-y-8 max-w-lg">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Underline Variant
          </h3>
          <UnderlineDemo />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Pill Variant
          </h3>
          <PillDemo />
        </div>
      </div>
    );
  },
};

// Mobile View
export const MobileView: Story = {
  render: () => <TabsDemo />,
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: {
      description: {
        story: "On mobile, tabs support swipe navigation between panels",
      },
    },
  },
};
