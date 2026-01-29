import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stack } from "./Stack";

/**
 * Stack Component
 *
 * Vertical flex layout with consistent gap between children.
 * Uses CSS gap property (not margins) for reliable spacing.
 */
const meta: Meta<typeof Stack> = {
  title: "UI/Stack",
  component: Stack,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    gap: {
      control: "select",
      options: [
        "space-0",
        "space-1",
        "space-2",
        "space-3",
        "space-4",
        "space-5",
        "space-6",
        "space-8",
        "space-10",
        "space-12",
        "space-16",
      ],
      description: "Gap between children (spacing token)",
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description: "Horizontal alignment of children",
    },
    divider: {
      control: "boolean",
      description: "Add dividers between children",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Stack>;

// Demo box component
function DemoBox({ label, color = "bg-[var(--color-surface-secondary)]" }: { label: string; color?: string }) {
  return (
    <div className={`p-4 rounded-lg border border-[var(--color-border)] ${color}`}>
      <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
    </div>
  );
}

// Default
export const Default: Story = {
  render: () => (
    <Stack gap="space-4">
      <DemoBox label="Item 1" />
      <DemoBox label="Item 2" />
      <DemoBox label="Item 3" />
    </Stack>
  ),
};

// Different gaps
export const SmallGap: Story = {
  render: () => (
    <Stack gap="space-2">
      <DemoBox label="Tight spacing" />
      <DemoBox label="space-2" />
      <DemoBox label="8px gap" />
    </Stack>
  ),
};

export const MediumGap: Story = {
  render: () => (
    <Stack gap="space-4">
      <DemoBox label="Default spacing" />
      <DemoBox label="space-4" />
      <DemoBox label="16px gap" />
    </Stack>
  ),
};

export const LargeGap: Story = {
  render: () => (
    <Stack gap="space-8">
      <DemoBox label="Loose spacing" />
      <DemoBox label="space-8" />
      <DemoBox label="32px gap" />
    </Stack>
  ),
};

// With dividers
export const WithDividers: Story = {
  render: () => (
    <Stack gap="space-4" divider>
      <DemoBox label="Section 1" />
      <DemoBox label="Section 2" />
      <DemoBox label="Section 3" />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: "Horizontal dividers between stack items",
      },
    },
  },
};

// Alignment options
export const AlignStart: Story = {
  render: () => (
    <Stack gap="space-4" align="start">
      <div className="px-4 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Short</div>
      <div className="px-8 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Medium content</div>
      <div className="px-16 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Much longer content here</div>
    </Stack>
  ),
};

export const AlignCenter: Story = {
  render: () => (
    <Stack gap="space-4" align="center">
      <div className="px-4 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Short</div>
      <div className="px-8 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Medium content</div>
      <div className="px-16 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Much longer content here</div>
    </Stack>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <Stack gap="space-4" align="end">
      <div className="px-4 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Short</div>
      <div className="px-8 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Medium content</div>
      <div className="px-16 py-2 bg-[var(--color-interactive-primary)] text-text-inverse rounded">Much longer content here</div>
    </Stack>
  ),
};

export const AlignStretch: Story = {
  render: () => (
    <Stack gap="space-4" align="stretch">
      <div className="p-4 bg-[var(--color-interactive-primary)] text-text-inverse rounded text-center">
        Full width (stretch)
      </div>
      <div className="p-4 bg-[var(--color-interactive-primary)] text-text-inverse rounded text-center">
        All items same width
      </div>
      <div className="p-4 bg-[var(--color-interactive-primary)] text-text-inverse rounded text-center">
        Default behavior
      </div>
    </Stack>
  ),
};

// Form example
export const FormLayout: Story = {
  render: () => (
    <Stack gap="space-5">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">
          Full Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">
          Email Address
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">
          Message
        </label>
        <textarea
          placeholder="Your message..."
          rows={3}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg resize-none"
        />
      </div>
      <button className="w-full py-2.5 bg-[var(--color-interactive-primary)] text-text-inverse font-medium rounded-lg">
        Submit
      </button>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: "Stack is ideal for form layouts with consistent spacing",
      },
    },
  },
};

// Card layout
export const CardLayout: Story = {
  render: () => (
    <Stack gap="space-6">
      {["Mohinga", "Tea Leaf Salad", "Shan Noodles"].map((name) => (
        <div
          key={name}
          className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">{name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Traditional Burmese dish</p>
            </div>
            <span className="font-bold text-[var(--color-interactive-primary)]">$12.00</span>
          </div>
        </div>
      ))}
    </Stack>
  ),
};

// Nested stacks
export const NestedStacks: Story = {
  render: () => (
    <Stack gap="space-6">
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">
        <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">Section 1</h3>
        <Stack gap="space-2">
          <div className="p-2 bg-surface-primary rounded border border-[var(--color-border)]">Nested item A</div>
          <div className="p-2 bg-surface-primary rounded border border-[var(--color-border)]">Nested item B</div>
        </Stack>
      </div>
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">
        <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">Section 2</h3>
        <Stack gap="space-2">
          <div className="p-2 bg-surface-primary rounded border border-[var(--color-border)]">Nested item C</div>
          <div className="p-2 bg-surface-primary rounded border border-[var(--color-border)]">Nested item D</div>
        </Stack>
      </div>
    </Stack>
  ),
};

// All gap sizes
export const AllGapSizes: Story = {
  render: () => (
    <div className="space-y-8">
      {(["space-1", "space-2", "space-4", "space-6", "space-8"] as const).map((gap) => (
        <div key={gap}>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">{gap}</p>
          <Stack gap={gap}>
            <div className="h-8 bg-[var(--color-interactive-primary)] rounded" />
            <div className="h-8 bg-[var(--color-interactive-primary)] rounded" />
            <div className="h-8 bg-[var(--color-interactive-primary)] rounded" />
          </Stack>
        </div>
      ))}
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
};
