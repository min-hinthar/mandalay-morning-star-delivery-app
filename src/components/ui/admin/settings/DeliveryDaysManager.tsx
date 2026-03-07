"use client";

/**
 * DeliveryDaysManager Component
 * Admin UI for managing per-day delivery settings (active toggle, cutoff, fees)
 * and Cash on Delivery toggle.
 *
 * Self-contained: fetches from /api/admin/delivery-days and /api/admin/settings.
 */

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeliveryDayConfig } from "@/types/delivery";

// ============================================
// CONSTANTS
// ============================================

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function centsToDollarsStr(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(dollars: string): number {
  return Math.round((parseFloat(dollars) || 0) * 100);
}

// ============================================
// TYPES
// ============================================

interface DeliveryDaysManagerProps {
  className?: string;
  /** Initial COD enabled state from parent settings */
  codEnabled?: boolean;
  /** Notify parent when COD toggle changes */
  onCodChange?: (enabled: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function DeliveryDaysManager({
  className,
  codEnabled: initialCodEnabled = false,
  onCodChange,
}: DeliveryDaysManagerProps) {
  const [days, setDays] = useState<DeliveryDayConfig[]>([]);
  const [codEnabled, setCodEnabled] = useState(initialCodEnabled);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch delivery days on mount
  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/admin/delivery-days");
        if (!res.ok) throw new Error("Failed to fetch delivery days");
        const json = await res.json();
        setDays(json.data?.days ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load delivery days");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Sync codEnabled from parent when it changes
  useEffect(() => {
    setCodEnabled(initialCodEnabled);
  }, [initialCodEnabled]);

  const handleDayChange = useCallback(
    (dayId: string, field: keyof DeliveryDayConfig, value: boolean | number) => {
      setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, [field]: value } : d)));
      setSuccessMsg(null);
    },
    []
  );

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch("/api/admin/delivery-days", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to save delivery days");
      }

      setSuccessMsg("Delivery days saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [days]);

  const handleCodToggle = useCallback(async () => {
    const newValue = !codEnabled;
    try {
      setError(null);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "delivery",
          settings: { cod_enabled: newValue },
        }),
      });
      if (!res.ok) throw new Error("Failed to update COD setting");
      setCodEnabled(newValue);
      onCodChange?.(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update COD setting");
    }
  }, [codEnabled, onCodChange]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 py-8 text-text-muted font-body", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading delivery schedule...
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-status-error-bg border border-status-error/20 rounded-lg text-status-error font-body text-sm">
          {error}
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3 bg-status-success-bg border border-status-success/20 rounded-lg text-status-success font-body text-sm">
          {successMsg}
        </div>
      )}

      {/* Delivery Days Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm font-body">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-text-primary font-semibold">Day</th>
              <th className="px-4 py-3 text-center text-text-primary font-semibold">Active</th>
              <th className="px-4 py-3 text-left text-text-primary font-semibold">Cutoff Day</th>
              <th className="px-4 py-3 text-left text-text-primary font-semibold">Cutoff Hour</th>
              <th className="px-4 py-3 text-left text-text-primary font-semibold">Delivery Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {days.map((day) => (
              <tr
                key={day.id}
                className={cn(
                  "transition-colors",
                  day.isActive ? "hover:bg-surface-secondary/50" : "opacity-50"
                )}
              >
                <td className="px-4 py-3 text-text-primary font-medium">
                  {DAY_NAMES[day.dayOfWeek]}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={day.isActive}
                    onChange={(e) => handleDayChange(day.id, "isActive", e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={day.cutoffDay}
                    onChange={(e) => handleDayChange(day.id, "cutoffDay", parseInt(e.target.value))}
                    disabled={!day.isActive}
                    className="px-2 py-1 border border-border rounded bg-surface-primary text-text-primary font-body text-sm disabled:opacity-50"
                  >
                    {DAY_NAMES.map((name, i) => (
                      <option key={i} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={day.cutoffHour}
                      onChange={(e) =>
                        handleDayChange(day.id, "cutoffHour", parseInt(e.target.value) || 0)
                      }
                      disabled={!day.isActive}
                      className="w-16"
                    />
                    <span className="text-text-muted text-xs whitespace-nowrap">
                      {formatHour(day.cutoffHour)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-text-muted">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={centsToDollarsStr(day.deliveryFeeCents)}
                      onChange={(e) =>
                        handleDayChange(day.id, "deliveryFeeCents", dollarsToCents(e.target.value))
                      }
                      disabled={!day.isActive}
                      className="w-20"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} size="sm">
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {isSaving ? "Saving..." : "Save Delivery Days"}
      </Button>

      {/* COD Toggle */}
      <div className="pt-6 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-body font-semibold text-text-primary">
              Cash on Delivery (COD)
            </Label>
            <p className="text-sm text-text-muted font-body mt-1">
              Allow customers to pay with cash at delivery. COD orders require admin approval.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={handleCodToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-surface-primary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>
    </div>
  );
}
