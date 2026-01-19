import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Grid } from "./Grid";

/**
 * V5 Grid Component
 *
 * CSS Grid layout with responsive column support and auto-fit capability.
 * Supports fixed columns, responsive breakpoints, and fluid auto-fit layouts.
 */
const meta: Meta<typeof Grid> = {
  title: "Layouts/Grid",
  component: Grid,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    cols: {
      control: "number",
      description: "Number of columns (or responsive object)",
    },
    gap: {
      control: "select",
      options: ["space-2", "space-4", "space-6", "space-8"],
      description: "Gap between grid items",
    },
    autoFit: {
      control: "boolean",
      description: "Use auto-fit with minmax for fluid responsive",
    },
    minChildWidth: {
      control: "text",
      description: "Minimum child width for autoFit (e.g., '280px')",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

// Demo card component
function DemoCard({ label, color = "bg-[var(--color-surface-secondary)]" }: { label: string; color?: string }) {
  return (
    <div className={`p-6 rounded-lg border border-[var(--color-border)] ${color}`}>
      <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
    </div>
  );
}

// Fixed columns
export const TwoColumns: Story = {
  render: () => (
    <Grid cols={2} gap="space-4">
      <DemoCard label="Item 1" />
      <DemoCard label="Item 2" />
      <DemoCard label="Item 3" />
      <DemoCard label="Item 4" />
    </Grid>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <Grid cols={3} gap="space-4">
      <DemoCard label="Item 1" />
      <DemoCard label="Item 2" />
      <DemoCard label="Item 3" />
      <DemoCard label="Item 4" />
      <DemoCard label="Item 5" />
      <DemoCard label="Item 6" />
    </Grid>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <Grid cols={4} gap="space-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <DemoCard key={i} label={`Item ${i + 1}`} />
      ))}
    </Grid>
  ),
};

// Responsive columns
export const Responsive: Story = {
  render: () => (
    <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="space-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <DemoCard key={i} label={`Item ${i + 1}`} />
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "1 column on mobile, 2 on sm, 3 on lg, 4 on xl. Resize viewport to see changes.",
      },
    },
  },
};

// Auto-fit (fluid responsive)
export const AutoFit: Story = {
  render: () => (
    <Grid autoFit minChildWidth="200px" gap="space-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <DemoCard key={i} label={`Auto-fit item ${i + 1}`} />
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "Auto-fit layout - items automatically fill available space with minimum width of 200px",
      },
    },
  },
};

export const AutoFitWide: Story = {
  render: () => (
    <Grid autoFit minChildWidth="300px" gap="space-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-8 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
          <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Card {i + 1}</h3>
          <p className="text-[var(--color-text-secondary)]">
            Auto-fit with 300px minimum width creates larger cards.
          </p>
        </div>
      ))}
    </Grid>
  ),
};

// Different gap sizes
export const SmallGap: Story = {
  render: () => (
    <Grid cols={3} gap="space-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <DemoCard key={i} label={`${i + 1}`} />
      ))}
    </Grid>
  ),
};

export const LargeGap: Story = {
  render: () => (
    <Grid cols={3} gap="space-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <DemoCard key={i} label={`${i + 1}`} />
      ))}
    </Grid>
  ),
};

// Different row/column gaps
export const DifferentGaps: Story = {
  render: () => (
    <Grid cols={3} rowGap="space-8" colGap="space-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <DemoCard key={i} label={`${i + 1}`} />
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different row gap (32px) and column gap (8px)",
      },
    },
  },
};

// Menu grid example
export const MenuGrid: Story = {
  render: () => {
    const menuItems = [
      { name: "Mohinga", price: "$12.00" },
      { name: "Tea Leaf Salad", price: "$8.00" },
      { name: "Shan Noodles", price: "$10.00" },
      { name: "Curry Rice", price: "$11.00" },
      { name: "Samosa", price: "$6.00" },
      { name: "Burmese Tea", price: "$3.50" },
    ];

    return (
      <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="space-4">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className="group p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-interactive-primary)]/30 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="aspect-video bg-[var(--color-surface-secondary)] rounded-lg mb-3" />
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-interactive-primary)]">
                {item.name}
              </h3>
              <span className="font-bold text-[var(--color-interactive-primary)]">{item.price}</span>
            </div>
          </div>
        ))}
      </Grid>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Responsive menu item grid with hover effects",
      },
    },
  },
};

// Dashboard grid example
export const DashboardGrid: Story = {
  render: () => (
    <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="space-4">
      {[
        { label: "Total Orders", value: "156", color: "bg-blue-50" },
        { label: "Revenue", value: "$4,280", color: "bg-green-50" },
        { label: "Active Drivers", value: "8", color: "bg-yellow-50" },
        { label: "Pending", value: "12", color: "bg-red-50" },
      ].map((stat) => (
        <div key={stat.label} className={`p-6 rounded-xl border border-[var(--color-border)] ${stat.color}`}>
          <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stat.value}</p>
        </div>
      ))}
    </Grid>
  ),
};

// Gallery grid
export const Gallery: Story = {
  render: () => (
    <Grid cols={{ base: 2, md: 3, lg: 4 }} gap="space-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gradient-to-br from-[var(--color-interactive-primary)] to-[var(--color-interactive-hover)] rounded-lg flex items-center justify-center"
        >
          <span className="text-white font-bold text-xl">{i + 1}</span>
        </div>
      ))}
    </Grid>
  ),
};

// Mixed content
export const MixedContent: Story = {
  render: () => (
    <Grid cols={{ base: 1, lg: 3 }} gap="space-6">
      <div className="lg:col-span-2 p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Main Content</h3>
        <p className="text-[var(--color-text-secondary)]">
          This item spans 2 columns on large screens. Perfect for featured content or main areas.
        </p>
      </div>
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Sidebar</h3>
        <p className="text-[var(--color-text-secondary)]">Single column sidebar content.</p>
      </div>
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Item 1</h3>
      </div>
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Item 2</h3>
      </div>
      <div className="p-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
        <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">Item 3</h3>
      </div>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "Grid items can span multiple columns using Tailwind classes like col-span-2",
      },
    },
  },
};
