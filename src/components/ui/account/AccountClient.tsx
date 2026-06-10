"use client";

/**
 * Account Client Component
 * Tabbed interface for customer account management
 *
 * Tabs: Profile, Orders, Settings
 * URL query param ?tab=settings&section=addresses for deep-linking
 */

import { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { m } from "framer-motion";
import { User, Package, Settings, MessageSquare, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/stores/cart-store";
import { AfterDarkAmbient } from "@/components/ui/AfterDarkAmbient";
import { AfterDarkSpotlight } from "@/components/ui/AfterDarkSpotlight";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TierUpCelebration } from "@/components/ui/TierUpCelebration";
import { AccountHero } from "./AccountHero";
import { ProfileTab } from "./ProfileTab";
import { OrdersTab } from "./OrdersTab";
import { SettingsTab } from "./SettingsTab";
import { FeedbackTab } from "./FeedbackTab";
import { RewardsTab } from "./RewardsTab";
import { ProfileSkeleton } from "./ProfileTab/ProfileSkeleton";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

type AccountTab = "profile" | "orders" | "rewards" | "feedback" | "settings";

const VALID_TABS: AccountTab[] = ["profile", "orders", "rewards", "feedback", "settings"];

const TABS = [
  { id: "profile" as const, label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "orders" as const, label: "Orders", icon: <Package className="h-4 w-4" /> },
  { id: "rewards" as const, label: "Rewards", icon: <Star className="h-4 w-4" /> },
  { id: "feedback" as const, label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "settings" as const, label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

function AccountClientInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { shouldAnimate } = useAnimationPreference();

  // The fixed CartBar (~150px incl. iOS safe-area) appears on every customer
  // page once the cart has items. Reserve clearance only when it's actually
  // shown — in sync with CartBar's own mount+items gate — so the page bottom
  // stays tight (no empty gap) when the cart is empty.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const hasCartItems = useCartStore((s) => s.items.length > 0);
  const padBottom = mounted && hasCartItems ? "pb-40" : "pb-16";

  // Read active tab from URL, validate, default to "profile"
  const tabParam = searchParams.get("tab");
  const activeTab: AccountTab =
    tabParam && VALID_TABS.includes(tabParam as AccountTab) ? (tabParam as AccountTab) : "profile";

  // Read section param for deep-linking into Settings sub-tabs
  const section = searchParams.get("section");

  const handleTabChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (id === "profile") {
        // Default tab — remove param for clean URL
        params.delete("tab");
      } else {
        params.set("tab", id);
      }

      // Clear section when switching away from settings
      if (id !== "settings") {
        params.delete("section");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <main
      className={cn(
        "after-dark-canvas relative isolate min-h-screen overflow-hidden px-4 pt-8",
        padBottom
      )}
    >
      {/* Kit living texture + desktop cursor spotlight, under all content */}
      <AfterDarkAmbient className="-z-10" />
      <AfterDarkSpotlight className="-z-10" />

      {/* Tier-up confetti + wax-seal stamp; self-deduping (once per crossing). */}
      <TierUpCelebration />

      <div className="container relative z-10 mx-auto max-w-4xl">
        {/* Loyalty passport hero — instant develop-rise on load (above the fold). */}
        <div className="animate-hero-develop-1">
          <AccountHero />
        </div>

        {/* Grouped pill tray — self-contained pills (bg + label on one element, no
            measured indicator → no dark-on-dark) inside a solid tray that reads as one
            segmented control instead of loose wrapping pills. Instant on load. */}
        <div
          role="tablist"
          aria-label="Account sections"
          className="animate-hero-develop-2 mb-6 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface-elevated p-1.5"
        >
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                // Key the active pill on its id so the one-shot gold sheen sweep
                // (.pill-sheen-activate) replays each time a pill becomes active.
                key={active ? `${t.id}-active` : t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active ? "menu-tab-active pill-sheen-activate" : "menu-tab-ghost"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content reveals as it scrolls into view (below-the-fold cards). The
            outer m.div keeps the quick tab-switch cross-fade; ScrollReveal handles
            the on-scroll rise. */}
        <m.div
          key={activeTab}
          role="tabpanel"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.2 }}
        >
          <ScrollReveal>
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "rewards" && <RewardsTab />}
            {activeTab === "feedback" && <FeedbackTab />}
            {activeTab === "settings" && <SettingsTab initialSection={section} />}
          </ScrollReveal>
        </m.div>
      </div>
    </main>
  );
}

export function AccountClient() {
  return (
    <Suspense
      fallback={
        <main className="after-dark-canvas min-h-screen px-4 pb-16 pt-8">
          <div className="container max-w-4xl mx-auto" aria-hidden="true">
            <Skeleton height={120} radius="lg" className="mb-6" />
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={36} width={80} radius="lg" />
              ))}
            </div>
            <ProfileSkeleton />
          </div>
        </main>
      }
    >
      <AccountClientInner />
    </Suspense>
  );
}
