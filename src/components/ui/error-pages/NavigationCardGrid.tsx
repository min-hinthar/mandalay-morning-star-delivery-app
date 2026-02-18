import Link from "next/link";

type Portal = "customer" | "admin" | "driver";

interface NavCard {
  emoji: string;
  label: string;
  href: string;
}

interface NavigationCardGridProps {
  portal: Portal;
}

const PORTAL_CARDS: Record<Portal, NavCard[]> = {
  customer: [
    { emoji: "\u{1F3E0}", label: "Home", href: "/" },
    { emoji: "\u{1F35C}", label: "Menu", href: "/menu" },
    { emoji: "\u{1F4E6}", label: "Orders", href: "/orders" },
  ],
  admin: [
    { emoji: "\u{1F4CA}", label: "Dashboard", href: "/admin" },
    { emoji: "\u{1F4E6}", label: "Orders", href: "/admin/orders" },
    { emoji: "\u{1F697}", label: "Drivers", href: "/admin/drivers" },
  ],
  driver: [
    { emoji: "\u{1F4CA}", label: "Dashboard", href: "/driver" },
    { emoji: "\u{1F5FA}\uFE0F", label: "Routes", href: "/driver/route" },
    { emoji: "\u{1F4DC}", label: "History", href: "/driver/history" },
  ],
};

const STAGGER_CLASSES = ["stagger-1", "stagger-2", "stagger-3"] as const;

export function NavigationCardGrid({ portal }: NavigationCardGridProps) {
  const cards = PORTAL_CARDS[portal];

  return (
    <nav aria-label="Quick navigation">
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {cards.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className={[
              "bg-surface-primary/90",
              "rounded-[var(--radius-card-sm)]",
              "p-4 text-center",
              "shadow-[var(--shadow-card)]",
              "hover:shadow-[var(--shadow-card-hover)]",
              "transition-all duration-200",
              "animate-fade-in-up",
              STAGGER_CLASSES[i],
            ].join(" ")}
          >
            <span className="block text-2xl mb-1" aria-hidden="true">
              {card.emoji}
            </span>
            <span className="text-sm font-medium text-text-primary">{card.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
