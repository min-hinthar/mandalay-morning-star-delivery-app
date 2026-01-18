import type { ReactElement } from "react";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MenuContent } from "../menu-content";
import type { MenuCategory } from "@/types/menu";

// Mock Intersection Observer
let intersectionCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  observe = mockObserve;
  unobserve = vi.fn();
  disconnect = mockDisconnect;
  takeRecords = vi.fn(() => []);
}

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
  const originalIntersectionObserver = window.IntersectionObserver;

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

  beforeAll(() => {
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterAll(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  beforeEach(() => {
    setMatchMedia(false);
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    window.scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = vi.fn();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
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

    // Calculation: elementPosition (200) + scrollY (0) - headerHeight (56) - 8 = 136
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 136,
      behavior: "smooth",
    });
  });

  it("updates the active tab on scroll", () => {
    renderMenu(<MenuContent categories={categories} />);

    const sidesSection = document.getElementById("category-sides") as HTMLElement;

    // Simulate Intersection Observer detecting "Sides" section as most visible
    act(() => {
      intersectionCallback(
        [
          {
            target: sidesSection,
            intersectionRatio: 0.5,
            isIntersecting: true,
            boundingClientRect: {} as DOMRect,
            intersectionRect: {} as DOMRect,
            rootBounds: null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByRole("tab", { name: "Sides" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
