"use client";

/**
 * Account Client Component
 * Tabbed interface for customer account management
 *
 * Tabs: Profile, Orders, Settings
 * URL query param ?tab=settings&section=addresses for deep-linking
 */

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { m } from "framer-motion";
import { User, Package, Settings, MessageSquare, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
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
    <main className="account-canvas min-h-screen px-4 pb-32 pt-8">
      <div className="container mx-auto max-w-4xl">
        {/* Loyalty passport hero */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: -12 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        >
          <AccountHero />
        </m.div>

        {/* Self-contained pill rail — bg + label on one element (no measured
            indicator), so the active label can't go dark-on-dark on the canvas. */}
        <div role="tablist" aria-label="Account sections" className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active ? "menu-tab-active" : "menu-tab-ghost"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        <m.div
          key={activeTab}
          role="tabpanel"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "rewards" && <RewardsTab />}
          {activeTab === "feedback" && <FeedbackTab />}
          {activeTab === "settings" && <SettingsTab initialSection={section} />}
        </m.div>
      </div>
    </main>
  );
}

export function AccountClient() {
  return (
    <Suspense
      fallback={
        <main className="account-canvas min-h-screen px-4 pb-32 pt-8">
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
