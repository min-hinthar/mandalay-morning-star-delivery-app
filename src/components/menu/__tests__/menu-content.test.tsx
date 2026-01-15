import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MenuContent } from "../menu-content";
import type { MenuCategory } from "@/lib/queries/menu";

const categories: MenuCategory[] = [
  {
    id: "cat-1",
    slug: "breakfast",
    name: "Breakfast",
    sort_order: 1,
    items: [
      {
        id: "item-1",
        slug: "kyay-o",
        name_en: "Kyay-O / Si-Chat",
        name_my: "Myanmar",
        description_en: "Rice vermicelli noodle soup.",
        base_price_cents: 1800,
        image_url: null,
        is_sold_out: false,
        allergens: ["egg"],
        tags: [],
        category: { id: "cat-1", slug: "breakfast", name: "Breakfast" },
      },
    ],
  },
  {
    id: "cat-2",
    slug: "sides",
    name: "Sides",
    sort_order: 2,
    items: [
      {
        id: "item-2",
        slug: "rice",
        name_en: "Rice",
        name_my: null,
        description_en: null,
        base_price_cents: 200,
        image_url: null,
        is_sold_out: true,
        allergens: [],
        tags: [],
        category: { id: "cat-2", slug: "sides", name: "Sides" },
      },
    ],
  },
];

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

describe("MenuContent", () => {
  const renderMenu = (ui: ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    setMatchMedia(false);
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    window.scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  it("renders category tabs and items", () => {
    renderMenu(<MenuContent categories={categories} />);

    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Breakfast" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sides" })).toBeInTheDocument();
    expect(screen.getByText("Kyay-O / Si-Chat")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Myanmar")).toHaveClass("font-burmese");
    expect(screen.getByText("$18.00")).toBeInTheDocument();
    expect(screen.getByText("Egg")).toBeInTheDocument();

    const soldOutCard = screen.getByText("Rice").closest("[class*='opacity-60']");
    expect(soldOutCard).toBeInTheDocument();
    expect(screen.getAllByText("Sold Out").length).toBeGreaterThan(0);
  });

  it("scrolls to a section when a tab is clicked", () => {
    renderMenu(<MenuContent categories={categories} />);

    const targetSection = document.getElementById("category-sides") as HTMLElement;
    targetSection.getBoundingClientRect = () =>
      ({ top: 200, left: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect);

    fireEvent.click(screen.getByRole("tab", { name: "Sides" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 60,
      behavior: "smooth",
    });
  });

  it("updates the active tab on scroll", () => {
    renderMenu(<MenuContent categories={categories} />);

    const breakfastSection = document.getElementById("category-breakfast") as HTMLElement;
    const sidesSection = document.getElementById("category-sides") as HTMLElement;

    Object.defineProperty(breakfastSection, "offsetTop", { value: 0 });
    Object.defineProperty(breakfastSection, "offsetHeight", { value: 500 });
    Object.defineProperty(sidesSection, "offsetTop", { value: 500 });
    Object.defineProperty(sidesSection, "offsetHeight", { value: 500 });

    Object.defineProperty(window, "scrollY", { value: 520, writable: true });
    fireEvent.scroll(window);

    expect(screen.getByRole("tab", { name: "Sides" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
