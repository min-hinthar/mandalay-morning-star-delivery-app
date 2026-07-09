"use client";

/**
 * DeliveryBandsEditor
 * Editable list of graduated distance fee bands (each: flat fee up to N miles).
 * The last band's distance is the edge of the standard (non-long-distance) zone.
 */

import { useEffect, useState } from "react";
import { Plus, Trash2, Route } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { DeliveryFeeBand } from "@/lib/utils/order";
import { centsToDollars, dollarsToCents, CHANGED_BORDER } from "./delivery-helpers";

interface DeliveryBandsEditorProps {
  bands: DeliveryFeeBand[];
  /** Local free-delivery radius — bands must extend beyond this */
  localRadiusMiles: number;
  /** Standard coverage radius — bands should not exceed this */
  standardRadiusMiles: number;
  onChange: (bands: DeliveryFeeBand[]) => void;
  changed?: boolean;
}

const MAX_BANDS = 6;

export function DeliveryBandsEditor({
  bands,
  localRadiusMiles,
  standardRadiusMiles,
  onChange,
  changed,
}: DeliveryBandsEditorProps) {
  // Per-row fee draft strings so typing "20." doesn't fight the controlled value.
  const [feeDrafts, setFeeDrafts] = useState<string[]>(() =>
    bands.map((b) => centsToDollars(b.feeCents))
  );

  // Keep each fee draft in sync with the canonical band value, EXCEPT while the
  // admin is mid-edit (a draft that still parses to the same cents is left alone,
  // so typing "20." isn't clobbered). This resyncs on external resets that keep
  // the same band count too — Discard, tab-revert, Restore Defaults — which a
  // length-keyed effect would miss.
  useEffect(() => {
    setFeeDrafts((prev) =>
      bands.map((b, i) => {
        const draft = prev[i];
        return draft != null && dollarsToCents(draft) === b.feeCents
          ? draft
          : centsToDollars(b.feeCents);
      })
    );
  }, [bands]);

  const updateMiles = (index: number, value: string) => {
    const miles = parseInt(value, 10);
    if (Number.isNaN(miles)) return;
    onChange(bands.map((b, i) => (i === index ? { ...b, maxMiles: miles } : b)));
  };

  const updateFee = (index: number, value: string) => {
    setFeeDrafts((prev) => prev.map((d, i) => (i === index ? value : d)));
    const cents = dollarsToCents(value);
    onChange(bands.map((b, i) => (i === index ? { ...b, feeCents: cents } : b)));
  };

  const removeBand = (index: number) => {
    // Keep at least one band so the extended fee is always editable — with zero
    // bands the fee falls back to the (no-longer-UI-editable) legacy flat fee.
    if (bands.length <= 1) return;
    onChange(bands.filter((_, i) => i !== index));
  };

  const addBand = () => {
    if (bands.length >= MAX_BANDS) return;
    const lastMiles = bands.length ? bands[bands.length - 1].maxMiles : localRadiusMiles;
    const lastFee = bands.length ? bands[bands.length - 1].feeCents : 2000;
    onChange([...bands, { maxMiles: lastMiles + 10, feeCents: lastFee + 500 }]);
  };

  // Ascending order is required for correct band matching — warn if broken.
  const outOfOrder = bands.some((b, i) => i > 0 && b.maxMiles <= bands[i - 1].maxMiles);
  // Bands at/inside the local radius are silently dropped at runtime — flag them.
  const insideLocalZone = bands.some((b) => b.maxMiles <= localRadiusMiles);
  // Bands past the standard radius push the standard coverage edge outward (they
  // extend serviceable range even with long-distance off) — flag the mismatch.
  const beyondStandard = bands.some((b) => b.maxMiles > standardRadiusMiles);

  return (
    <div className={cn("space-y-3", changed && CHANGED_BORDER)}>
      <div className="flex items-center gap-2">
        <Route className="h-4 w-4 text-text-secondary" aria-hidden />
        <Label>Distance Fee Bands</Label>
      </div>
      <p className="text-xs text-text-muted">
        Graduated fees between the local zone and the standard radius. Charged when a subtotal
        can&apos;t earn free delivery.
      </p>

      <div className="space-y-2">
        {bands.length === 0 && (
          <p className="text-xs text-text-muted italic">
            No bands — a single flat extended fee applies. Add a band to graduate pricing.
          </p>
        )}
        {bands.map((band, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              {index === 0 && <span className="text-2xs text-text-muted">Up to (mi)</span>}
              <Input
                type="number"
                min={1}
                max={100}
                step={1}
                value={band.maxMiles}
                onChange={(e) => updateMiles(index, e.target.value)}
                aria-label={`Band ${index + 1} distance in miles`}
              />
            </div>
            <div className="flex-1 space-y-1">
              {index === 0 && <span className="text-2xs text-text-muted">Fee</span>}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={feeDrafts[index] ?? centsToDollars(band.feeCents)}
                  onChange={(e) => updateFee(index, e.target.value)}
                  className="pl-7"
                  aria-label={`Band ${index + 1} fee in dollars`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeBand(index)}
              disabled={bands.length <= 1}
              title={bands.length <= 1 ? "At least one band is required" : undefined}
              className={cn(
                "mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
                bands.length <= 1
                  ? "cursor-not-allowed text-text-muted/40"
                  : "text-text-muted hover:bg-status-error/10 hover:text-status-error"
              )}
              aria-label={`Remove band ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {outOfOrder && (
        <p className="text-xs text-status-warning">
          Bands should increase in distance from top to bottom.
        </p>
      )}

      {insideLocalZone && (
        <p className="text-xs text-status-warning">
          Bands must be farther than the local zone radius ({localRadiusMiles} mi) — closer bands
          are ignored.
        </p>
      )}

      {beyondStandard && (
        <p className="text-xs text-status-warning">
          A band exceeds the standard radius ({standardRadiusMiles} mi) — it extends coverage even
          when long-distance delivery is off.
        </p>
      )}

      {bands.length < MAX_BANDS && (
        <button
          type="button"
          onClick={addBand}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add band
        </button>
      )}
    </div>
  );
}
