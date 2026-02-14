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
import { User, Package, Settings } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { ProfileTab } from "./ProfileTab";
import { OrdersTab } from "./OrdersTab";
import { SettingsTab } from "./SettingsTab";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

type AccountTab = "profile" | "orders" | "settings";

const VALID_TABS: AccountTab[] = ["profile", "orders", "settings"];

const TABS = [
  { id: "profile" as const, label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "orders" as const, label: "Orders", icon: <Package className="h-4 w-4" /> },
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
    tabParam && VALID_TABS.includes(tabParam as AccountTab)
      ? (tabParam as AccountTab)
      : "profile";

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
      router.replace(
        queryString ? `${pathname}?${queryString}` : pathname,
        { scroll: false },
      );
    },
    [searchParams, router, pathname],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4">
      <div className="container max-w-4xl mx-auto">
        <m.h1
          initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          className="text-3xl font-display font-bold text-text-primary mb-6"
        >
          My Account
        </m.h1>

        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mb-6"
        />

        <m.div
          key={activeTab}
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "orders" && <OrdersTab />}
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
        <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="h-10 w-48 bg-surface-secondary rounded-card-sm animate-pulse mb-6" />
            <div className="h-12 bg-surface-secondary rounded-card-sm animate-pulse mb-6" />
            <div className="h-64 bg-surface-secondary rounded-card-sm animate-pulse" />
          </div>
        </main>
      }
    >
      <AccountClientInner />
    </Suspense>
  );
}
