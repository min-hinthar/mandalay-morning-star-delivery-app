"use client";

import { m } from "framer-motion";
import { Clock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { COVERAGE_LIMITS } from "@/types/address";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDeviceTier } from "@/lib/hooks/useHeroFx";
import { StatusBar } from "./StatusBar";
import { LiveDeliveryMap } from "./LiveDeliveryMap";
import { StaticCoverageMap } from "./StaticCoverageMap";
import { HeroCardLayers } from "../HeroCardLayers";
import { HeroSunburst } from "../HeroSunburst";
import type { DeliveryMapCardProps } from "./types";

export function DeliveryMapCard({ nextDeliveryDate, deliverySchedule }: DeliveryMapCardProps) {
  const { shouldAnimate } = useAnimationPreference();
  const tier = useDeviceTier();
  // Only DESKTOP gets the live WebGL Google Map. ALL mobile (incl. "high" tier:
  // a recent iPhone reports ≥8 cores) gets the lightweight static diagram — a
  // high core count doesn't lift WebKit's per-TAB memory ceiling, and the live
  // map + tiles OOM-crash iOS on the menu→homepage path (cumulative memory).
  // (SSR/first paint = "low", so the SDK never loads on a low-end first paint.)
  const liteMap = tier !== "desktop";

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      viewport={{ once: true }}
      transition={{ ...spring.gentle, delay: 0.1 }}
      className="relative"
    >
      {/* Ambient glow — radial-gradient falloff (no blur backing store; stays
          within the mobile GPU budget) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 rounded-[2rem]"
        style={{
          background:
            "radial-gradient(58% 60% at 50% 38%, rgba(217,119,87,0.20), rgba(106,155,204,0.12) 46%, transparent 76%)",
        }}
      />

      {/* Warm-paper "map print" mat — vellum frame with corner ticks + edge glow */}
      <div className="relative rounded-[1.75rem] hero-surface-vellum p-2.5 md:p-3">
        <HeroCardLayers accent="blue" radius="rounded-[1.75rem]" dots={false} grain={false} />

        {/* Editorial caption */}
        <div className="relative mb-2 flex items-center justify-between gap-2 px-1.5 pt-0.5">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.18em] text-hero-accent md:text-xs">
            <HeroSunburst className="h-3.5 w-3.5 text-hero-clay" rays={8} />
            Delivery coverage
            <span className="font-burmese tracking-normal text-hero-ink-muted">
              · ပို့ဆောင်ဧရိယာ
            </span>
          </p>
          <p className="text-2xs font-medium text-hero-ink-muted md:text-xs">
            <span className="font-semibold text-hero-ink">Greater Los Angeles</span>
          </p>
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl ring-1 ring-hero-line",
            "shadow-[0_8px_40px_rgba(20,20,19,0.18),0_16px_64px_rgba(20,20,19,0.12)]"
          )}
        >
          {/* Map — live (capable devices) or lightweight static diagram (low/mid) */}
          <div className="h-72 md:h-[26rem]">
            {liteMap ? <StaticCoverageMap /> : <LiveDeliveryMap shouldAnimate={shouldAnimate} />}
          </div>

          {/* Gradient depth overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

          {/* Top-left badge: live pulse + duration (compact on mobile) */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.2 }}
            className="absolute left-2.5 top-2.5 md:left-3 md:top-3"
          >
            <div className="flex items-center gap-1.5 rounded-xl hero-surface-paper px-2.5 py-1.5 text-2xs font-medium shadow-md md:gap-2 md:px-3 md:py-2 md:text-xs">
              <m.div
                animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
                transition={{ duration: 2, repeat: 5 }}
                className="h-2 w-2 rounded-full bg-hero-sage md:h-2.5 md:w-2.5"
              />
              <span className="font-semibold text-hero-ink">Now delivering</span>
              <span className="text-hero-ink-muted/50">&bull;</span>
              <Clock className="h-3 w-3 text-hero-clay md:h-3.5 md:w-3.5" />
              <span className="text-hero-ink-muted">{COVERAGE_LIMITS.maxDurationMinutes} min</span>
            </div>
          </m.div>

          {/* Top-right badge: kitchen logo (label hidden on mobile to avoid crowding) */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, x: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.3 }}
            className="absolute right-2.5 top-2.5 md:right-3 md:top-3"
          >
            <div className="flex items-center gap-2 rounded-xl hero-surface-paper px-1.5 py-1.5 shadow-md md:px-2">
              <Image
                src="/logo.png"
                alt="Mandalay Morning Star"
                width={28}
                height={19}
                className="rounded-lg"
              />
              <div className="hidden pr-1 sm:block">
                <p className="text-xs font-bold leading-tight text-hero-ink">Kitchen</p>
                <p className="text-2xs leading-tight text-hero-ink-muted">Covina, CA</p>
              </div>
            </div>
          </m.div>

          {/* Bottom status bar */}
          <StatusBar nextDeliveryDate={nextDeliveryDate} deliverySchedule={deliverySchedule} />
        </div>
      </div>
    </m.div>
  );
}
