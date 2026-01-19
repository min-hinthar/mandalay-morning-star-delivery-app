import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MenuContent } from "../menu-content";
import type { MenuCategory } from "@/types/menu";

const categories: MenuCategory[] = [
  {
    id: "cat-1",
    slug: "breakfast",
    name: "Breakfast",
    sortOrder: 1,
    items: [
      {
        id: "item-1",
        slug: "kyay-o",
        nameEn: "Kyay-O / Si-Chat",
        nameMy: "Myanmar",
        descriptionEn: "Rice vermicelli noodle soup.",
        basePriceCents: 1800,
        imageUrl: null,
        isActive: true,
        isSoldOut: false,
        allergens: ["egg"],
        tags: [],
        modifierGroups: [],
      },
    ],
  },
  {
    id: "cat-2",
    slug: "sides",
    name: "Sides",
    sortOrder: 2,
    items: [
      {
        id: "item-2",
        slug: "rice",
        nameEn: "Rice",
        nameMy: null,
        descriptionEn: null,
        basePriceCents: 200,
        imageUrl: null,
        isActive: true,
        isSoldOut: true,
        allergens: [],
        tags: [],
        modifierGroups: [],
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
  });

  it("renders menu header with title", () => {
    renderMenu(<MenuContent categories={categories} />);
    expect(screen.getByText("Our Menu")).toBeInTheDocument();
  });

  it("renders category headers", () => {
    renderMenu(<MenuContent categories={categories} />);
    // Accordion triggers should be visible as buttons
    expect(screen.getByRole("button", { name: /breakfast/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sides/i })).toBeInTheDocument();
  });

  it("renders with search input on desktop", () => {
    renderMenu(<MenuContent categories={categories} />);
    // Search placeholder is present in the DOM (even if hidden on mobile)
    expect(screen.getByPlaceholderText("Search menu...")).toBeInTheDocument();
  });
});
