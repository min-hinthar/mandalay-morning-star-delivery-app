"use client";

/**
 * Account Client Component
 * Tabbed interface for customer account management
 *
 * Tabs: Profile, Orders, Addresses, Payment (placeholder)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Package, MapPin, CreditCard } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { ProfileTab } from "./ProfileTab";
import { OrdersTab } from "./OrdersTab";
import { AddressesTab } from "./AddressesTab";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

type AccountTab = "profile" | "orders" | "addresses" | "payment";

const TABS = [
  { id: "profile" as const, label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "orders" as const, label: "Orders", icon: <Package className="h-4 w-4" /> },
  { id: "addresses" as const, label: "Addresses", icon: <MapPin className="h-4 w-4" /> },
  { id: "payment" as const, label: "Payment", icon: <CreditCard className="h-4 w-4" /> },
];

export function AccountClient() {
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const { shouldAnimate } = useAnimationPreference();

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.h1
          initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          className="text-3xl font-display font-bold text-text-primary mb-6"
        >
          My Account
        </motion.h1>

        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as AccountTab)}
          className="mb-6"
          layoutId="accountTab"
        />

        <motion.div
          key={activeTab}
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "addresses" && <AddressesTab />}
          {activeTab === "payment" && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-text-muted" />
              <p className="text-text-muted">Payment methods coming soon</p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
