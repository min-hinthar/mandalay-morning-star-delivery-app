"use client";

/**
 * SettingsNudgeBanner
 * Branded, dismissible nudge card shown on the home page for authenticated users.
 * Shows 3 mini-preview toggles (dietary, delivery instructions, notifications)
 * that save inline to customer_settings via Supabase client.
 *
 * Disappears after dismissal OR after visiting settings.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Check, Loader2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import type { Json } from "@/types/database";

// ============================================
// CONSTANTS
// ============================================

const DISMISSED_KEY = "settings-nudge-dismissed";
const VISITED_KEY = "settings-visited";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Nut Allergy",
  "Dairy-free",
  "Halal",
] as const;

type DietaryOption = (typeof DIETARY_OPTIONS)[number];

interface NotificationPrefs {
  order_updates: boolean;
  marketing: boolean;
  reminders: boolean;
}

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  order_updates: true,
  marketing: true,
  reminders: true,
};

type SaveStatus = "idle" | "saving" | "saved";

// ============================================
// INLINE SAVE HELPERS
// ============================================

async function upsertCustomerSettings(
  userId: string,
  data: {
    dietary_restrictions?: string[];
    delivery_instructions?: string;
    notification_prefs?: NotificationPrefs;
  }
) {
  const supabase = createClient();

  // Lazy row creation: upsert on user_id
  // Cast JSONB fields to Json type for Supabase compatibility
  const payload: Record<string, unknown> = { user_id: userId };
  if (data.dietary_restrictions !== undefined) {
    payload.dietary_restrictions = data.dietary_restrictions as unknown as Json;
  }
  if (data.delivery_instructions !== undefined) {
    payload.delivery_instructions = data.delivery_instructions;
  }
  if (data.notification_prefs !== undefined) {
    payload.notification_prefs = data.notification_prefs as unknown as Json;
  }

  const { error } = await supabase
    .from("customer_settings")
    .upsert(
      payload as { user_id: string; [key: string]: unknown },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Failed to save customer settings:", error);
    throw error;
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SectionSaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs ml-2">
      {status === "saving" && (
        <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
      )}
      {status === "saved" && (
        <Check className="h-3 w-3 text-green" />
      )}
      <span className={status === "saved" ? "text-green" : "text-amber-600"}>
        {status === "saving" ? "Saving..." : "Saved"}
      </span>
    </span>
  );
}

function DietaryPills({
  selected,
  onChange,
}: {
  selected: DietaryOption[];
  onChange: (items: DietaryOption[]) => void;
}) {
  const toggle = (option: DietaryOption) => {
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DIETARY_OPTIONS.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "px-3 py-1.5 rounded-pill text-xs font-medium transition-colors",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "bg-amber-600 text-text-inverse border-amber-600"
                : "bg-surface-primary text-text-secondary border-amber-200 hover:border-amber-400 hover:bg-amber-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function MiniToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-xs font-medium text-text-primary cursor-pointer">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          checked ? "bg-green" : "bg-surface-tertiary"
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-surface-primary shadow-sm transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SettingsNudgeBanner() {
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Settings state
  const [dietary, setDietary] = useState<DietaryOption[]>([]);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);

  // Save status per section
  const [dietarySaveStatus, setDietarySaveStatus] = useState<SaveStatus>("idle");
  const [deliverySaveStatus, setDeliverySaveStatus] = useState<SaveStatus>("idle");
  const [notifSaveStatus, setNotifSaveStatus] = useState<SaveStatus>("idle");

  // Check auth + localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    const visited = localStorage.getItem(VISITED_KEY) === "true";

    if (dismissed || visited) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setVisible(true);
        // Load existing settings if any
        loadExisting(user.id);
      }
    });
  }, []);

  const loadExisting = async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("customer_settings")
      .select("dietary_restrictions, delivery_instructions, notification_prefs")
      .eq("user_id", uid)
      .maybeSingle();

    if (data) {
      const restrictions = data.dietary_restrictions as string[] | null;
      if (restrictions && Array.isArray(restrictions)) {
        setDietary(restrictions as DietaryOption[]);
      }
      if (data.delivery_instructions) {
        setDeliveryInstructions(data.delivery_instructions as string);
      }
      const prefs = data.notification_prefs as NotificationPrefs | null;
      if (prefs) {
        setNotifPrefs(prefs);
      }
    }
  };

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }, []);

  // Auto-save dietary changes with debounce
  const saveDietary = useCallback(
    async (items: DietaryOption[]) => {
      if (!userId) return;
      setDietarySaveStatus("saving");
      try {
        await upsertCustomerSettings(userId, { dietary_restrictions: items });
        setDietarySaveStatus("saved");
        setTimeout(() => setDietarySaveStatus("idle"), 2000);
      } catch {
        setDietarySaveStatus("idle");
      }
    },
    [userId]
  );

  const saveDeliveryInstructions = useCallback(
    async (instructions: string) => {
      if (!userId) return;
      setDeliverySaveStatus("saving");
      try {
        await upsertCustomerSettings(userId, { delivery_instructions: instructions });
        setDeliverySaveStatus("saved");
        setTimeout(() => setDeliverySaveStatus("idle"), 2000);
      } catch {
        setDeliverySaveStatus("idle");
      }
    },
    [userId]
  );

  const saveNotifications = useCallback(
    async (prefs: NotificationPrefs) => {
      if (!userId) return;
      setNotifSaveStatus("saving");
      try {
        await upsertCustomerSettings(userId, { notification_prefs: prefs });
        setNotifSaveStatus("saved");
        setTimeout(() => setNotifSaveStatus("idle"), 2000);
      } catch {
        setNotifSaveStatus("idle");
      }
    },
    [userId]
  );

  const handleDietaryChange = (items: DietaryOption[]) => {
    setDietary(items);
    saveDietary(items);
  };

  const handleDeliveryBlur = () => {
    saveDeliveryInstructions(deliveryInstructions);
  };

  const handleNotifChange = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    saveNotifications(next);
  };

  return (
    <AnimatePresence>
      {visible && (
        <m.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={spring.gentle}
          className="px-4 py-6 md:py-8"
        >
          <div className="max-w-4xl mx-auto">
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden",
                "bg-gradient-to-r from-amber-50 to-orange-50",
                "border border-amber-200 shadow-md"
              )}
            >
              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  "absolute top-3 right-3 z-10",
                  "p-1.5 rounded-full bg-surface-primary/80 hover:bg-surface-primary",
                  "text-amber-700 hover:text-amber-900 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-label="Dismiss settings nudge"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-5 md:p-8">
                {/* Header with mascot */}
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-3xl md:text-4xl shrink-0" role="img" aria-label="star mascot">
                    &#11088;
                  </span>
                  <div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-amber-900">
                      Personalize Your Experience
                    </h3>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Set your dietary preferences, delivery address, and notifications &mdash; takes 30 seconds!
                    </p>
                  </div>
                </div>

                {/* Mini-preview sections */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* 1. Dietary Restrictions */}
                  <div className="rounded-xl bg-surface-primary/70 p-4 border border-amber-100">
                    <div className="flex items-center mb-2.5">
                      <span className="text-sm font-semibold text-amber-900">Dietary</span>
                      <SectionSaveIndicator status={dietarySaveStatus} />
                    </div>
                    <DietaryPills selected={dietary} onChange={handleDietaryChange} />
                  </div>

                  {/* 2. Delivery Instructions */}
                  <div className="rounded-xl bg-surface-primary/70 p-4 border border-amber-100">
                    <div className="flex items-center mb-2.5">
                      <span className="text-sm font-semibold text-amber-900">Delivery</span>
                      <SectionSaveIndicator status={deliverySaveStatus} />
                    </div>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      onBlur={handleDeliveryBlur}
                      placeholder="e.g. Leave at door"
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg",
                        "border border-amber-200 bg-surface-primary",
                        "placeholder:text-amber-400",
                        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      )}
                    />
                    <p className="mt-1.5 text-xs text-amber-600">Default delivery instructions</p>
                  </div>

                  {/* 3. Notification Toggles */}
                  <div className="rounded-xl bg-surface-primary/70 p-4 border border-amber-100">
                    <div className="flex items-center mb-2.5">
                      <span className="text-sm font-semibold text-amber-900">Notifications</span>
                      <SectionSaveIndicator status={notifSaveStatus} />
                    </div>
                    <div className="space-y-2">
                      <MiniToggle
                        id="nudge-order-updates"
                        label="Order Updates"
                        checked={notifPrefs.order_updates}
                        onChange={(v) => handleNotifChange("order_updates", v)}
                      />
                      <MiniToggle
                        id="nudge-marketing"
                        label="Marketing"
                        checked={notifPrefs.marketing}
                        onChange={(v) => handleNotifChange("marketing", v)}
                      />
                      <MiniToggle
                        id="nudge-reminders"
                        label="Reminders"
                        checked={notifPrefs.reminders}
                        onChange={(v) => handleNotifChange("reminders", v)}
                      />
                    </div>
                  </div>
                </div>

                {/* See all settings link */}
                <div className="mt-4 text-center">
                  <Link
                    href="/account"
                    onClick={() => localStorage.setItem(VISITED_KEY, "true")}
                    className="text-sm font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
                  >
                    See all settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </m.section>
      )}
    </AnimatePresence>
  );
}
