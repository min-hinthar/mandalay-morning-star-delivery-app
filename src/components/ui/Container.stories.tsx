import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container } from "./Container";

/**
 * Container Component
 *
 * Responsive container with CSS Container Queries support.
 * Children can use @container queries to respond to container width.
 *
 * Sizes: sm (640px), md (768px), lg (1024px), xl (1280px), full
 */
const meta: Meta<typeof Container> = {
  title: "UI/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
      description: "Maximum width of the container",
    },
    flush: {
      control: "boolean",
      description: "Remove horizontal padding",
    },
    center: {
      control: "boolean",
      description: "Center the container horizontally",
    },
    query: {
      control: "boolean",
      description: "Enable CSS container queries",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

// Demo content component
function DemoContent({ label }: { label?: string }) {
  return (
    <div className="p-6 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
      <h3 className="font-semibold text-lg mb-2 text-[var(--color-text-primary)]">
        {label || "Container Content"}
      </h3>
      <p className="text-[var(--color-text-secondary)]">
        This content is inside the container. The container provides max-width constraints
        and responsive padding. Resize the viewport to see how it behaves.
      </p>
    </div>
  );
}

// Default (lg)
export const Default: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container>
        <DemoContent label="Default Container (lg - 1024px)" />
      </Container>
    </div>
  ),
};

// Small
export const Small: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="sm">
        <DemoContent label="Small Container (640px) - Good for prose" />
      </Container>
    </div>
  ),
};

// Medium
export const Medium: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="md">
        <DemoContent label="Medium Container (768px) - Good for forms" />
      </Container>
    </div>
  ),
};

// Large
export const Large: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="lg">
        <DemoContent label="Large Container (1024px) - Default" />
      </Container>
    </div>
  ),
};

// Extra Large
export const ExtraLarge: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="xl">
        <DemoContent label="Extra Large Container (1280px) - Wide layouts" />
      </Container>
    </div>
  ),
};

// Full width
export const Full: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="full">
        <DemoContent label="Full Width Container - Edge to edge" />
      </Container>
    </div>
  ),
};

// Flush (no padding)
export const Flush: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="lg" flush>
        <div className="p-6 bg-[var(--color-interactive-primary)] text-white rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Flush Container</h3>
          <p>No horizontal padding - useful for hero sections or edge-to-edge content</p>
        </div>
      </Container>
    </div>
  ),
};

// All Sizes Comparison
export const AllSizes: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8 space-y-6">
      <Container size="sm">
        <div className="p-4 bg-blue-100 border border-blue-300 rounded text-center">
          <span className="font-medium">sm (640px)</span>
        </div>
      </Container>
      <Container size="md">
        <div className="p-4 bg-green-100 border border-green-300 rounded text-center">
          <span className="font-medium">md (768px)</span>
        </div>
      </Container>
      <Container size="lg">
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded text-center">
          <span className="font-medium">lg (1024px)</span>
        </div>
      </Container>
      <Container size="xl">
        <div className="p-4 bg-purple-100 border border-purple-300 rounded text-center">
          <span className="font-medium">xl (1280px)</span>
        </div>
      </Container>
      <Container size="full">
        <div className="p-4 bg-red-100 border border-red-300 rounded text-center">
          <span className="font-medium">full (100%)</span>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Visual comparison of all container sizes",
      },
    },
  },
};

// Nested Containers
export const Nested: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8">
      <Container size="xl">
        <div className="p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Outer: xl (1280px)</p>
          <Container size="md" center>
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Inner: md (768px)</p>
              <Container size="sm" center>
                <div className="p-4 bg-[var(--color-interactive-primary)]/10 border border-[var(--color-interactive-primary)] rounded-lg text-center">
                  <p className="font-medium text-[var(--color-text-primary)]">Innermost: sm (640px)</p>
                </div>
              </Container>
            </div>
          </Container>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Containers can be nested for complex layouts",
      },
    },
  },
};

// As different elements
export const AsDifferentElements: Story = {
  render: () => (
    <div className="bg-[var(--color-surface)] min-h-screen py-8 space-y-6">
      <Container as="section" size="lg">
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">
          <code className="text-sm text-[var(--color-text-secondary)]">&lt;section&gt;</code>
          <p className="mt-2">Container rendered as a section element</p>
        </div>
      </Container>
      <Container as="article" size="lg">
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">
          <code className="text-sm text-[var(--color-text-secondary)]">&lt;article&gt;</code>
          <p className="mt-2">Container rendered as an article element</p>
        </div>
      </Container>
      <Container as="main" size="lg">
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-lg">
          <code className="text-sm text-[var(--color-text-secondary)]">&lt;main&gt;</code>
          <p className="mt-2">Container rendered as a main element</p>
        </div>
      </Container>
    </div>
  ),
};
