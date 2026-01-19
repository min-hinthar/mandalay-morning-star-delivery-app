import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Modal, ConfirmModal, ModalHeader, ModalFooter, useModal } from "./Modal";
import { Button } from "./button";

/**
 * V5 Modal System
 *
 * Production-grade accessible modal with responsive animations.
 * - Desktop: Scale + fade centered dialog
 * - Mobile: Slide up bottom sheet with swipe-to-close
 *
 * Sizes: sm, md, lg, xl, full
 */
const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Accessible modal with focus trap, backdrop click, escape key, and swipe-to-close on mobile.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
      description: "Size of the modal",
    },
    showCloseButton: {
      control: "boolean",
      description: "Show close button in top right",
    },
    closeOnBackdropClick: {
      control: "boolean",
      description: "Close when clicking backdrop",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Close when pressing Escape",
    },
    closeOnSwipeDown: {
      control: "boolean",
      description: "Close on swipe down (mobile)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Interactive wrapper for stories
function ModalDemo({
  size = "md",
  showCloseButton = true,
  ...props
}: Partial<React.ComponentProps<typeof Modal>>) {
  const { isOpen, open, close } = useModal();

  return (
    <div className="p-8">
      <Button onClick={open}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Demo Modal"
        size={size}
        showCloseButton={showCloseButton}
        {...props}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Modal Content
          </h3>
          <p className="text-[var(--color-text-secondary)]">
            This is a demo modal showing the V5 design system. It includes
            focus trap, backdrop click, and escape key handling.
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Default
export const Default: Story = {
  render: () => <ModalDemo />,
};

// Sizes
export const Small: Story = {
  render: () => <ModalDemo size="sm" />,
  parameters: {
    docs: { description: { story: "Small modal (max-w-sm)" } },
  },
};

export const Medium: Story = {
  render: () => <ModalDemo size="md" />,
  parameters: {
    docs: { description: { story: "Medium modal (max-w-md) - Default" } },
  },
};

export const Large: Story = {
  render: () => <ModalDemo size="lg" />,
  parameters: {
    docs: { description: { story: "Large modal (max-w-lg)" } },
  },
};

export const ExtraLarge: Story = {
  render: () => <ModalDemo size="xl" />,
  parameters: {
    docs: { description: { story: "Extra large modal (max-w-xl)" } },
  },
};

export const Full: Story = {
  render: () => <ModalDemo size="full" />,
  parameters: {
    docs: { description: { story: "Full width modal" } },
  },
};

// With Header and Footer
function ModalWithHeaderFooter() {
  const { isOpen, open, close } = useModal();

  return (
    <div className="p-8">
      <Button onClick={open}>Open Modal with Header/Footer</Button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Modal with Header and Footer"
        size="md"
        header={<ModalHeader>Order Details</ModalHeader>}
        footer={
          <ModalFooter>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Place Order</Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)]">
            This modal has a styled header and footer with action buttons.
          </p>
          <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg">
            <p className="font-medium">Mohinga (Fish Noodle Soup)</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Qty: 2 × $12.00
            </p>
          </div>
          <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg">
            <p className="font-medium">Tea Leaf Salad</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Qty: 1 × $8.00
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export const WithHeaderFooter: Story = {
  render: () => <ModalWithHeaderFooter />,
};

// Confirm Modal
function ConfirmModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<"default" | "danger">("default");

  return (
    <div className="p-8 flex gap-4">
      <Button
        onClick={() => {
          setVariant("default");
          setIsOpen(true);
        }}
      >
        Confirm Action
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          setVariant("danger");
          setIsOpen(true);
        }}
      >
        Delete Item
      </Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => alert("Confirmed!")}
        title={variant === "danger" ? "Delete Item?" : "Confirm Action"}
        message={
          variant === "danger"
            ? "This action cannot be undone. The item will be permanently removed from your cart."
            : "Are you sure you want to proceed with this action?"
        }
        variant={variant}
        confirmLabel={variant === "danger" ? "Delete" : "Confirm"}
      />
    </div>
  );
}

export const Confirmation: Story = {
  render: () => <ConfirmModalDemo />,
  parameters: {
    docs: {
      description: {
        story: "Pre-built confirmation dialog with default and danger variants",
      },
    },
  },
};

// Loading state
function ConfirmModalLoading() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Confirm with Loading</Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => !isLoading && setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Process Order"
        message="This will send the order to the kitchen. Continue?"
        confirmLabel="Process"
        isLoading={isLoading}
      />
    </div>
  );
}

export const ConfirmWithLoading: Story = {
  render: () => <ConfirmModalLoading />,
};

// Without close button
export const NoCloseButton: Story = {
  render: () => <ModalDemo showCloseButton={false} />,
  parameters: {
    docs: {
      description: {
        story: "Modal without close button - requires action to dismiss",
      },
    },
  },
};

// Scrollable content
function ScrollableModal() {
  const { isOpen, open, close } = useModal();

  return (
    <div className="p-8">
      <Button onClick={open}>Open Scrollable Modal</Button>
      <Modal isOpen={isOpen} onClose={close} title="Menu" size="md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Full Menu
          </h3>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-[var(--color-surface-secondary)] rounded-lg"
            >
              <p className="font-medium">Menu Item {i + 1}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Description of the menu item with pricing and details.
              </p>
            </div>
          ))}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-[var(--color-surface)] py-4">
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
            <Button onClick={close}>Add All to Cart</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export const Scrollable: Story = {
  render: () => <ScrollableModal />,
  parameters: {
    docs: {
      description: {
        story: "Modal with scrollable content for long forms or lists",
      },
    },
  },
};

// Mobile viewport (view in viewport addon)
export const MobileView: Story = {
  render: () => <ModalDemo />,
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: {
      description: {
        story:
          "On mobile, modal appears as bottom sheet with swipe-to-close gesture",
      },
    },
  },
};
