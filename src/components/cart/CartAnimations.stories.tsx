import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  AddToCartButton,
  QuantitySelector,
  SwipeableCartItem,
  CartBadge,
  CartDrawer,
  CartItemList,
  type CartItem,
} from "./CartAnimations";
import { Button } from "@/components/ui/button";

/**
 * V5 Cart Animations
 *
 * Animation components for cart interactions:
 * - Add to cart button with state transitions
 * - Quantity selector with 3D flip animation
 * - Swipeable cart items
 * - Cart badge with bounce
 * - Cart drawer with swipe-to-close
 */
const meta: Meta = {
  title: "Cart/CartAnimations",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Sample cart items
const sampleItems: CartItem[] = [
  { id: "1", name: "Mohinga (Fish Noodle Soup)", price: 12.0, quantity: 2, image: "/placeholder.jpg" },
  { id: "2", name: "Tea Leaf Salad", price: 8.0, quantity: 1, image: "/placeholder.jpg" },
  { id: "3", name: "Shan Noodles", price: 10.0, quantity: 3, image: "/placeholder.jpg" },
];

// Add to Cart Button
export const AddToCart: Story = {
  render: () => {
    const AddToCartDemo = () => {
      const handleClick = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      };

      return (
        <div className="space-y-4">
          <AddToCartButton onClick={handleClick}>Add to Cart</AddToCartButton>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Click to see loading → success animation
          </p>
        </div>
      );
    };

    return <AddToCartDemo />;
  },
};

export const AddToCartSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AddToCartButton onClick={() => Promise.resolve()} size="sm">
        Small
      </AddToCartButton>
      <AddToCartButton onClick={() => Promise.resolve()} size="md">
        Medium
      </AddToCartButton>
      <AddToCartButton onClick={() => Promise.resolve()} size="lg">
        Large
      </AddToCartButton>
    </div>
  ),
};

export const AddToCartError: Story = {
  render: () => {
    const ErrorDemo = () => {
      const handleClick = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        throw new Error("Out of stock");
      };

      return (
        <div className="space-y-4">
          <AddToCartButton onClick={handleClick}>Add to Cart</AddToCartButton>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Click to see error shake animation
          </p>
        </div>
      );
    };

    return <ErrorDemo />;
  },
};

export const AddToCartDisabled: Story = {
  render: () => (
    <AddToCartButton onClick={() => Promise.resolve()} disabled>
      Sold Out
    </AddToCartButton>
  ),
};

// Quantity Selector
export const QuantitySelectorDefault: Story = {
  render: () => {
    const QuantityDemo = () => {
      const [quantity, setQuantity] = useState(1);

      return (
        <div className="space-y-4">
          <QuantitySelector value={quantity} onChange={setQuantity} />
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Current quantity: {quantity}
          </p>
        </div>
      );
    };

    return <QuantityDemo />;
  },
};

export const QuantitySelectorSizes: Story = {
  render: () => {
    const SizesDemo = () => {
      const [qty1, setQty1] = useState(1);
      const [qty2, setQty2] = useState(1);

      return (
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Small</p>
            <QuantitySelector value={qty1} onChange={setQty1} size="sm" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Medium</p>
            <QuantitySelector value={qty2} onChange={setQty2} size="md" />
          </div>
        </div>
      );
    };

    return <SizesDemo />;
  },
};

export const QuantitySelectorLimits: Story = {
  render: () => {
    const LimitsDemo = () => {
      const [quantity, setQuantity] = useState(1);

      return (
        <div className="space-y-4">
          <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={5} />
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Min: 1, Max: 5 (Current: {quantity})
          </p>
        </div>
      );
    };

    return <LimitsDemo />;
  },
};

// Cart Badge
export const Badge: Story = {
  render: () => {
    const BadgeDemo = () => {
      const [count, setCount] = useState(3);

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-8 justify-center">
            <div className="relative inline-block">
              <Button variant="outline" size="icon">
                🛒
              </Button>
              <CartBadge count={count} />
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={() => setCount((c) => Math.max(0, c - 1))}>
              Remove
            </Button>
            <Button size="sm" onClick={() => setCount((c) => c + 1)}>
              Add Item
            </Button>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Badge bounces when count increases
          </p>
        </div>
      );
    };

    return <BadgeDemo />;
  },
};

export const BadgeCounts: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      {[1, 5, 10, 50, 99, 100].map((count) => (
        <div key={count} className="relative inline-block">
          <div className="w-10 h-10 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center">
            🛒
          </div>
          <CartBadge count={count} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badge shows '99+' for counts over 99",
      },
    },
  },
};

// Swipeable Cart Item
export const SwipeableItem: Story = {
  render: () => {
    const SwipeDemo = () => {
      const [items, setItems] = useState(sampleItems);

      const handleRemove = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      };

      const handleQuantityChange = (id: string, quantity: number) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
      };

      return (
        <div className="w-96 space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Swipe left to reveal delete button
          </p>
          {items.map((item) => (
            <SwipeableCartItem
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onQuantityChange={handleQuantityChange}
            />
          ))}
          {items.length === 0 && (
            <p className="text-center text-[var(--color-text-secondary)] py-8">
              All items removed!{" "}
              <button
                className="text-[var(--color-interactive-primary)] underline"
                onClick={() => setItems(sampleItems)}
              >
                Reset
              </button>
            </p>
          )}
        </div>
      );
    };

    return <SwipeDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Cart items with swipe-to-delete gesture on mobile",
      },
    },
  },
};

// Cart Item List
export const ItemList: Story = {
  render: () => {
    const ListDemo = () => {
      const [items, setItems] = useState(sampleItems);

      const handleRemove = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      };

      const handleQuantityChange = (id: string, quantity: number) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
      };

      return (
        <div className="w-96">
          <CartItemList
            items={items}
            onRemove={handleRemove}
            onQuantityChange={handleQuantityChange}
          />
          {items.length > 0 && (
            <div className="mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-[var(--color-interactive-primary)]">
                  ${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    };

    return <ListDemo />;
  },
};

export const EmptyItemList: Story = {
  render: () => (
    <div className="w-96">
      <CartItemList items={[]} onRemove={() => {}} onQuantityChange={() => {}} />
    </div>
  ),
};

// Cart Drawer
export const Drawer: Story = {
  render: () => {
    const DrawerDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [items, setItems] = useState(sampleItems);

      const handleRemove = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      };

      const handleQuantityChange = (id: string, quantity: number) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
      };

      return (
        <div>
          <Button onClick={() => setIsOpen(true)}>Open Cart Drawer</Button>
          <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div className="px-4 pb-4">
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">
                Your Cart ({items.length})
              </h2>
              <CartItemList
                items={items}
                onRemove={handleRemove}
                onQuantityChange={handleQuantityChange}
              />
              {items.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-[var(--color-interactive-primary)]">
                      ${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => setIsOpen(false)}>
                    Checkout
                  </Button>
                </div>
              )}
            </div>
          </CartDrawer>
        </div>
      );
    };

    return <DrawerDemo />;
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "Bottom sheet drawer with swipe-to-close gesture. Drag down to close.",
      },
    },
  },
};

// All Animations Combined
export const AllAnimations: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
          Add to Cart Button States
        </h3>
        <div className="flex gap-4">
          <AddToCartButton onClick={() => Promise.resolve()}>Add</AddToCartButton>
          <AddToCartButton onClick={() => Promise.resolve()} disabled>
            Sold Out
          </AddToCartButton>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
          Quantity Selector
        </h3>
        <div className="flex gap-4 items-center">
          <QuantitySelector value={1} onChange={() => {}} size="sm" />
          <QuantitySelector value={5} onChange={() => {}} size="md" />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
          Cart Badge
        </h3>
        <div className="flex gap-6">
          {[1, 5, 99, 150].map((count) => (
            <div key={count} className="relative">
              <div className="w-10 h-10 bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center">
                🛒
              </div>
              <CartBadge count={count} />
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
