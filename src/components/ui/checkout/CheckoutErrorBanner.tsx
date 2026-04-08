"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Calendar,
  ShoppingCart,
  CreditCard,
  UserX,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { ErrorShake } from "@/components/ui/error-shake";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/currency";

/** Mirrors DirectionMismatchDetails from checkout session helpers (server-only) */
interface DirectionMismatchDetails {
  customerDirections: string[];
  customerRouteLabel: string;
  selectedDayDirection: string;
  eligibleDayNames: string[];
}

/** Phase 111 CHKP-02 — Payload for PRICE_CHANGED case */
interface PriceChangedDetails {
  items: Array<{
    name: string;
    oldPriceCents: number;
    newPriceCents: number;
    direction: "up" | "down";
  }>;
  /** Dominant direction — "up" if any item went up, "down" only if all went down */
  overallDirection: "up" | "down";
}

export interface CheckoutErrorData {
  code: string;
  message: string;
  details?: unknown;
}

interface CheckoutErrorBannerProps {
  error: CheckoutErrorData;
  onChangeAddress?: () => void;
  onChangeDate?: (date?: string) => void;
  onUpdateCart?: () => void;
  onRetry?: () => void;
  className?: string;
}

/** Compute next N dates for given day names from today */
function getNextDatesForDays(dayNames: string[], count: number): { label: string; date: string }[] {
  const dayNameToNum: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDays = dayNames.map((n) => dayNameToNum[n]).filter((n) => n !== undefined);
  const results: { label: string; date: string }[] = [];
  const today = new Date();

  for (let i = 1; i <= 30 && results.length < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (targetDays.includes(d.getDay())) {
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      results.push({ label, date: dateStr });
    }
  }
  return results;
}

const DIRECTION_COLORS: Record<string, string> = {
  east: "bg-blue-100 text-blue-700 border-blue-200",
  west: "bg-purple-100 text-purple-700 border-purple-200",
  south: "bg-amber-100 text-amber-700 border-amber-200",
};

export function CheckoutErrorBanner({
  error,
  onChangeAddress,
  onChangeDate,
  onUpdateCart,
  onRetry,
  className,
}: CheckoutErrorBannerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const content = useMemo(() => {
    switch (error.code) {
      case "VALIDATION_ERROR": {
        const details = error.details as DirectionMismatchDetails | undefined;
        if (details?.customerDirections && details?.eligibleDayNames) {
          return renderDirectionMismatch(details, onChangeDate);
        }
        return renderGenericError(error.message);
      }
      case "OUT_OF_COVERAGE":
        return renderWithAction(
          <MapPin className="w-4 h-4" />,
          "Address Not Verified",
          error.message,
          "သင့်လိပ်စာသည် ပို့ဆောင်ရေးနယ်မြေ ပြင်ပတွင် ရှိနေပါသည်။",
          onChangeAddress ? (
            <Button variant="outline" size="sm" onClick={onChangeAddress}>
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Change address
            </Button>
          ) : null
        );
      case "ADDRESS_INVALID":
        return renderWithAction(
          <MapPin className="w-4 h-4" />,
          "Address Not Found",
          error.message,
          null,
          onChangeAddress ? (
            <Button variant="outline" size="sm" onClick={onChangeAddress}>
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Change address
            </Button>
          ) : null
        );
      case "ITEM_UNAVAILABLE": {
        const itemDetails = error.details as { unavailableItems?: string[] } | undefined;
        const unavailableItems = itemDetails?.unavailableItems;
        return renderItemUnavailable(error.message, unavailableItems, onUpdateCart);
      }
      case "COD_DISABLED":
        return renderWithAction(
          <CreditCard className="w-4 h-4" />,
          "COD Temporarily Unavailable",
          "Cash on Delivery is not available right now. Please use card payment instead.",
          "ငွေသားဖြင့် ငွေပေးချေမှု ယာယီမရနိုင်ပါ။",
          null
        );
      case "STRIPE_ERROR":
        return renderWithAction(
          <CreditCard className="w-4 h-4" />,
          "Payment Service Unavailable",
          error.message,
          null,
          onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try again
            </Button>
          ) : null
        );
      // Phase 110 CFIX-04 — Stripe checkout fetch timed out after 10s.
      // Retry re-invokes handleCheckout which preserves the per-order
      // idempotency key server-side (checkout_${order.id}).
      case "CHECKOUT_NETWORK_TIMEOUT":
        return renderWithAction(
          <AlertTriangle className="w-4 h-4" />,
          "Checkout Timed Out",
          error.message,
          "ငွေပေးချေမှု အချိန်ကုန်သွားပါသည်။ ထပ်မံ ကြိုးစားပါ။",
          onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try again
            </Button>
          ) : null
        );
      case "PROFILE_ERROR":
        return renderWithAction(
          <UserX className="w-4 h-4" />,
          "Account Setup Issue",
          error.message,
          null,
          null
        );
      // Phase 111 CHKP-02 D-15 — Price change detected via useCartValidation
      // polling. Shows old → new per-item with direction-aware colors.
      case "PRICE_CHANGED": {
        const details = error.details as PriceChangedDetails | undefined;
        if (!details || details.items.length === 0) {
          return renderGenericError(error.message);
        }
        return renderPriceChange(details, onUpdateCart);
      }
      default:
        return renderGenericError(error.message);
    }
  }, [error, onChangeAddress, onChangeDate, onUpdateCart, onRetry]);

  // Phase 111 CHKP-02 D-18 — direction-aware outer wrapper classes for
  // PRICE_CHANGED; other cases preserve the legacy error-colored shell.
  const priceChangedOverallDirection =
    error.code === "PRICE_CHANGED"
      ? (error.details as PriceChangedDetails | undefined)?.overallDirection
      : undefined;

  return (
    <ErrorShake shake={!!error}>
      <m.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.95, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
        exit={shouldAnimate ? { opacity: 0, scale: 0.95, y: -10 } : undefined}
        transition={getSpring(spring.default)}
        role={error.code === "PRICE_CHANGED" ? "status" : undefined}
        aria-live={error.code === "PRICE_CHANGED" ? "polite" : undefined}
        className={cn(
          "rounded-xl border p-4",
          error.code === "PRICE_CHANGED" && priceChangedOverallDirection === "down"
            ? "border-status-success/20 bg-status-success-bg"
            : error.code === "PRICE_CHANGED"
              ? "border-status-warning/20 bg-status-warning-bg"
              : "border-status-error/20 bg-status-error-bg",
          className
        )}
      >
        {content}
      </m.div>
    </ErrorShake>
  );
}

function renderDirectionMismatch(
  details: DirectionMismatchDetails,
  onChangeDate?: (date?: string) => void
) {
  const primaryDir = details.customerDirections[0];
  const colorClass = DIRECTION_COLORS[primaryDir] ?? "bg-primary/10 text-primary border-primary/20";
  const nextDates = getNextDatesForDays(details.eligibleDayNames, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-status-error/10">
          <Calendar className="w-4 h-4 text-status-error" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-medium text-status-error">Wrong Delivery Day</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Your address is on the</span>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", colorClass)}>
              {details.customerRouteLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Available days:</span>
            {details.eligibleDayNames.map((day) => (
              <span
                key={day}
                className="text-2xs px-2 py-0.5 rounded-full bg-surface-primary border border-border font-medium text-text-primary"
              >
                {day}
              </span>
            ))}
          </div>
          <p className="text-2xs text-text-muted/70">
            သင့်လိပ်စာအတွက် မှန်ကန်သော ပို့ဆောင်ရေးရက်ကို ရွေးချယ်ပါ။
          </p>
        </div>
      </div>

      {/* Clickable date pills */}
      {nextDates.length > 0 && onChangeDate && (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs text-text-muted self-center">Pick a date:</span>
          {nextDates.map((nd) => (
            <button
              key={nd.date}
              type="button"
              onClick={() => onChangeDate(nd.date)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-full",
                "border border-primary/30 bg-primary/5 text-primary",
                "hover:bg-primary/10 hover:border-primary/50 transition-colors"
              )}
            >
              {nd.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function renderWithAction(
  icon: React.ReactNode,
  title: string,
  message: string,
  burmese: string | null,
  action: React.ReactNode | null
) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-status-error/10 text-status-error">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-status-error">{title}</p>
          <p className="text-xs text-text-muted mt-0.5">{message}</p>
          {burmese && <p className="text-2xs text-text-muted/70 mt-1">{burmese}</p>}
        </div>
      </div>
      {action && <div className="flex justify-end">{action}</div>}
    </div>
  );
}

function renderItemUnavailable(
  message: string,
  unavailableItems: string[] | undefined,
  onUpdateCart?: () => void
) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-status-error/10 text-status-error">
          <ShoppingCart className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-status-error">Items Unavailable</p>
          {unavailableItems && unavailableItems.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {unavailableItems.map((name) => (
                <li key={name} className="text-xs text-text-muted flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-status-error/50 shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted mt-0.5">{message}</p>
          )}
        </div>
      </div>
      {onUpdateCart && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onUpdateCart}>
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Update cart
          </Button>
        </div>
      )}
    </div>
  );
}

function renderGenericError(message: string) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-lg bg-status-error/10">
        <AlertTriangle className="w-4 h-4 text-status-error" />
      </div>
      <p className="text-sm text-status-error">{message}</p>
    </div>
  );
}

/**
 * Phase 111 CHKP-02 — Price change banner content.
 * Direction-aware colors: warning for up, success for down. Per-item old → new
 * price rows rendered through formatPrice (NOT raw cents/100 math) to match
 * the rest of the checkout surface (CheckoutSummaryV8, TipSelector, etc.).
 * Burmese companion string uses the declared text-xs token per UI-SPEC.
 */
function renderPriceChange(details: PriceChangedDetails, onUpdateCart?: () => void) {
  const isUp = details.overallDirection === "up";
  const Icon = isUp ? TrendingUp : TrendingDown;
  const iconBgClass = isUp ? "bg-status-warning/10" : "bg-status-success/10";
  const iconColorClass = isUp ? "text-status-warning" : "text-status-success";
  const headlineClass = isUp ? "text-status-warning" : "text-status-success";
  // Phase 111 CHKP-02 UI-SPEC §Copywriting
  const headline = isUp ? "Heads up — prices changed" : "Good news — prices dropped";
  // BURMESE-REVIEW Phase 111 D-40 — native-speaker sign-off pending
  const headlineBurmese = isUp
    ? "သတိပြုပါ — စျေးနှုန်း ပြောင်းလဲသွားပါသည်"
    : "သတင်းကောင်း — စျေးနှုန်း လျှော့ချသွားပါသည်";

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className={cn("p-1.5 rounded-lg", iconBgClass)}>
          <Icon className={cn("w-4 h-4", iconColorClass)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className={cn("text-sm font-medium", headlineClass)}>{headline}</p>
          {/* UI-SPEC §Typography — smallest declared token is text-xs (12px) */}
          <p className="text-xs text-text-muted/70" lang="my">
            {headlineBurmese}
          </p>
          <p className="text-xs text-text-muted">Since you added items to your cart:</p>
          <ul className="space-y-1.5">
            {details.items.map((it) => (
              <li key={it.name} className="flex items-center gap-2 text-sm">
                <span className="text-text-primary min-w-0 truncate">{it.name}:</span>
                {/* Phase 111 CHKP-02 — formatPrice per UI-SPEC §Typography (canonical money helper) */}
                <span className="text-text-muted line-through">
                  {formatPrice(it.oldPriceCents)}
                </span>
                <span className="text-text-muted">→</span>
                <span
                  className={cn(
                    "font-semibold",
                    it.direction === "up" ? "text-status-warning" : "text-status-success"
                  )}
                >
                  {formatPrice(it.newPriceCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {onUpdateCart && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onUpdateCart}
            className="text-sm font-medium text-primary hover:underline"
          >
            Update cart
          </button>
        </div>
      )}
    </div>
  );
}
