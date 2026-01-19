/**
 * Accessible Accordion Component
 * Demonstrates proper ARIA patterns with useId for unique IDs
 */

import { useState, useId, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface AccordionItemData {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItemData[];
  /** Allow multiple items open simultaneously */
  allowMultiple?: boolean;
  /** Default expanded item IDs */
  defaultExpanded?: string[];
  className?: string;
}

interface AccordionItemProps {
  item: AccordionItemData;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  totalItems: number;
}

// =============================================================================
// Animation Variants
// =============================================================================

const contentVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },
};

const iconVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
};

// =============================================================================
// AccordionItem Component
// =============================================================================

function AccordionItem({
  item,
  isExpanded,
  onToggle,
  index,
  totalItems,
}: AccordionItemProps) {
  // Generate unique IDs for ARIA relationships
  const headerId = useId();
  const contentId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      // Space and Enter are handled by default button behavior
      // Add Home/End navigation if needed
      if (e.key === "Home") {
        e.preventDefault();
        // Focus first accordion header
        const firstHeader = e.currentTarget
          .closest('[role="region"]')
          ?.parentElement?.querySelector("button");
        firstHeader?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        // Focus last accordion header
        const headers = e.currentTarget
          .closest('[role="region"]')
          ?.parentElement?.querySelectorAll("button");
        headers?.[headers.length - 1]?.focus();
      }
    },
    []
  );

  return (
    <div
      className="border-b border-gray-200 last:border-b-0"
      data-testid={`accordion-item-${item.id}`}
      data-expanded={isExpanded}
    >
      {/* Header Button */}
      <h3>
        <button
          id={headerId}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className={`
            flex w-full items-center justify-between
            px-4 py-3
            text-left text-base font-medium
            text-gray-900 dark:text-gray-100
            hover:bg-gray-50 dark:hover:bg-gray-800
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            transition-colors duration-150
          `}
        >
          <span>{item.title}</span>
          <motion.span
            variants={iconVariants}
            animate={isExpanded ? "expanded" : "collapsed"}
            transition={{ duration: 0.2 }}
            className="text-gray-500"
          >
            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
          </motion.span>
        </button>
      </h3>

      {/* Content Panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 text-gray-600 dark:text-gray-300">
              {item.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Accordion Component
// =============================================================================

export function Accordion({
  items,
  allowMultiple = false,
  defaultExpanded = [],
  className = "",
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const toggleItem = useCallback(
    (itemId: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);

        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(itemId);
        }

        return next;
      });
    },
    [allowMultiple]
  );

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      data-testid="accordion"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
          index={index}
          totalItems={items.length}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Usage Example
// =============================================================================

export function AccordionExample() {
  const faqItems: AccordionItemData[] = [
    {
      id: "shipping",
      title: "How long does shipping take?",
      content: (
        <p>
          Standard shipping takes 3-5 business days. Express shipping is
          available for 1-2 business day delivery.
        </p>
      ),
    },
    {
      id: "returns",
      title: "What is your return policy?",
      content: (
        <div className="space-y-2">
          <p>We accept returns within 30 days of purchase.</p>
          <ul className="list-disc pl-5">
            <li>Items must be unused and in original packaging</li>
            <li>Include the receipt or proof of purchase</li>
            <li>Refunds are processed within 5-7 business days</li>
          </ul>
        </div>
      ),
    },
    {
      id: "support",
      title: "How can I contact customer support?",
      content: (
        <p>
          You can reach us via email at support@example.com or call us at
          1-800-EXAMPLE during business hours (9am-5pm EST).
        </p>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <Accordion items={faqItems} defaultExpanded={["shipping"]} />
    </div>
  );
}

// =============================================================================
// Test Helpers
// =============================================================================

/*
Testing this component:

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./accessible-accordion";

describe("Accordion", () => {
  const items = [
    { id: "1", title: "Item 1", content: "Content 1" },
    { id: "2", title: "Item 2", content: "Content 2" },
  ];

  it("expands item on click", async () => {
    render(<Accordion items={items} />);
    const button = screen.getByRole("button", { name: "Item 1" });

    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content 1")).toBeVisible();
  });

  it("supports keyboard navigation", async () => {
    render(<Accordion items={items} />);
    const button = screen.getByRole("button", { name: "Item 1" });

    button.focus();
    await userEvent.keyboard("{Enter}");

    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("has correct ARIA attributes", () => {
    render(<Accordion items={items} defaultExpanded={["1"]} />);
    const button = screen.getByRole("button", { name: "Item 1" });
    const region = screen.getByRole("region");

    expect(button).toHaveAttribute("aria-controls");
    expect(region).toHaveAttribute("aria-labelledby", button.id);
  });
});
*/
