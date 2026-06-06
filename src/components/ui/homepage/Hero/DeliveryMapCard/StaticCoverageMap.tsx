"use client";

/**
 * StaticCoverageMap — a REAL static map snapshot (Google Static Maps API) with a
 * lightweight ANIMATED delivery overlay, shown on low/mid mobile instead of the
 * live Google Map (which OOM-crashes low-end retina iPhones). The base is a
 * single image (no WebGL / tile cache / map markers); the life comes from a
 * handful of CSS/Framer pins — truck/package icons at the cities' true bearings,
 * dropping in, with an auto-cycling "active" pin that surfaces the same info the
 * desktop tooltip shows (city · direction · delivery days). Falls back to a pure
 * SVG coverage diagram if the Static Maps API is unavailable.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Truck, Package } from "lucide-react";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

type Dir = "east" | "west" | "south";

const CENTER_LAT = KITCHEN_LOCATION.lat;
const CENTER_LNG = KITCHEN_LOCATION.lng;
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const ZOOM = 9;
const IMG_W = 600;
const IMG_H = 400;

const DIRECTION_DAYS: Record<Dir, string> = {
  east: "Mon/Sat",
  west: "Wed/Sat",
  south: "Thu/Sat",
};
const DIR_VAR: Record<Dir, string> = {
  east: "var(--hero-blue)",
  west: "var(--hero-sage)",
  south: "var(--hero-clay)",
};

const CITIES: { name: string; lat: number; lng: number; dir: Dir }[] = [
  { name: "Santa Monica", lat: 34.0195, lng: -118.4912, dir: "west" },
  { name: "Downtown LA", lat: 34.0407, lng: -118.2468, dir: "west" },
  { name: "Pasadena", lat: 34.1478, lng: -118.1445, dir: "west" },
  { name: "Long Beach", lat: 33.7701, lng: -118.1937, dir: "south" },
  { name: "Anaheim", lat: 33.8366, lng: -117.9143, dir: "south" },
  { name: "Irvine", lat: 33.6846, lng: -117.8265, dir: "south" },
  { name: "Pomona", lat: 34.0551, lng: -117.75, dir: "east" },
  { name: "Rancho Cucamonga", lat: 34.1064, lng: -117.5931, dir: "east" },
  { name: "Riverside", lat: 33.9533, lng: -117.3962, dir: "east" },
];

// ---- Web-Mercator projection into the static image's logical pixel box ----
const WORLD = 256 * 2 ** ZOOM;
function worldPx(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * WORLD;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * WORLD;
  return { x, y };
}
const CENTER_PX = worldPx(CENTER_LAT, CENTER_LNG);
/** City positions in the 600×400 image-logical space (centered on Covina). */
const CITY_PX = CITIES.map((c) => {
  const p = worldPx(c.lat, c.lng);
  return { ...c, lx: IMG_W / 2 + (p.x - CENTER_PX.x), ly: IMG_H / 2 + (p.y - CENTER_PX.y) };
});

function circlePath(): string {
  const rLat = COVERAGE_LIMITS.maxDistanceMiles / 69;
  const rLng = rLat / Math.cos((CENTER_LAT * Math.PI) / 180);
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(
      `${(CENTER_LAT + rLat * Math.cos(a)).toFixed(4)},${(CENTER_LNG + rLng * Math.sin(a)).toFixed(4)}`
    );
  }
  return pts.join("|");
}

function staticMapUrl(): string {
  const center = `${CENTER_LAT},${CENTER_LNG}`;
  const params = [
    `center=${center}`,
    `zoom=${ZOOM}`,
    `size=${IMG_W}x${IMG_H}`,
    "scale=2",
    "maptype=roadmap",
    "style=feature:poi|visibility:off",
    "style=feature:transit|visibility:off",
    "style=feature:road|element:labels|visibility:off",
    "style=saturation:-22|lightness:6",
    `path=fillcolor:0xd9775720|color:0xd9775777|weight:1|${circlePath()}`,
    `key=${KEY}`,
  ];
  return `https://maps.googleapis.com/maps/api/staticmap?${params.join("&")}`;
}

export function StaticCoverageMap() {
  const { shouldAnimate } = useAnimationPreference();
  const [imgError, setImgError] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Measure the container so the overlay can match the image's object-cover fit.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-cycle the "active" pin to surface each city's info in turn.
  useEffect(() => {
    if (!shouldAnimate) return;
    const id = setInterval(() => setActive((a) => (a + 1) % CITY_PX.length), 2600);
    return () => clearInterval(id);
  }, [shouldAnimate]);

  if (!KEY || imgError) return <SvgFallback />;

  // object-cover mapping: scale the 600×400 image to cover the box, centered.
  const cover = box.w && box.h ? Math.max(box.w / IMG_W, box.h / IMG_H) : 0;
  const offX = (box.w - IMG_W * cover) / 2;
  const offY = (box.h - IMG_H * cover) / 2;
  const pos = (lx: number, ly: number) => ({
    left: `${((offX + lx * cover) / box.w) * 100}%`,
    top: `${((offY + ly * cover) / box.h) * 100}%`,
  });
  const ActiveIcon = active % 2 === 0 ? Truck : Package;

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-hero-stat-bg/40">
      {/* eslint-disable-next-line @next/next/no-img-element -- external Static Maps
          URL with onError fallback; next/image remote loader is overkill here */}
      <img
        src={staticMapUrl()}
        alt={`Delivery coverage across Greater Los Angeles — about ${COVERAGE_LIMITS.maxDistanceMiles} miles from our Covina kitchen`}
        className="h-full w-full object-cover"
        decoding="async"
        onError={() => setImgError(true)}
      />

      {/* Animated delivery overlay (decorative) */}
      {cover > 0 && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Kitchen */}
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={pos(IMG_W / 2, IMG_H / 2)}
          >
            <span className="block h-3.5 w-3.5 rounded-full bg-hero-clay ring-2 ring-hero-card shadow-md" />
            {shouldAnimate && (
              <m.span
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--hero-clay)" }}
                animate={{ scale: [1, 2.4], opacity: [0.35, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </span>

          {/* City delivery pins */}
          {CITY_PX.map((c, i) => {
            const Icon = i % 2 === 0 ? Truck : Package;
            const isActive = i === active;
            return (
              <m.span
                key={c.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={pos(c.lx, c.ly)}
                initial={shouldAnimate ? { opacity: 0, scale: 0, y: -6 } : false}
                animate={{ opacity: 1, scale: isActive ? 1.18 : 1, y: 0 }}
                transition={
                  shouldAnimate
                    ? { delay: 0.15 + i * 0.12, type: "spring", stiffness: 320, damping: 20 }
                    : { duration: 0 }
                }
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-full bg-hero-card shadow-md ring-2"
                  style={{ ["--tw-ring-color" as string]: DIR_VAR[c.dir] }}
                >
                  <Icon className="h-3 w-3" style={{ color: DIR_VAR[c.dir] }} />
                </span>
                {shouldAnimate && isActive && (
                  <m.span
                    className="absolute inset-0 rounded-full"
                    style={{ background: DIR_VAR[c.dir] }}
                    animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </m.span>
            );
          })}

          {/* Active-city info chip — fixed upper-center so it's always in bounds
              and always on top (no per-pin tooltip clipping / z-fighting). */}
          <AnimatePresence mode="wait">
            <m.div
              key={active}
              initial={shouldAnimate ? { opacity: 0, y: -4 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, y: -4 } : undefined}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute left-1/2 top-12 flex max-w-[80%] -translate-x-1/2 items-center gap-1.5 truncate rounded-full hero-surface-paper px-2.5 py-1 text-2xs font-semibold text-hero-ink shadow-md md:top-14"
            >
              <ActiveIcon className="h-3 w-3" style={{ color: DIR_VAR[CITY_PX[active].dir] }} />
              {CITY_PX[active].name}
              <span className="font-normal text-hero-ink-muted">
                · {DIRECTION_DAYS[CITY_PX[active].dir]}
              </span>
            </m.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ---- SVG fallback (no external dependency, used only if no API key) ----

const SCALE = 52;
const clamp = (v: number) => Math.max(8, Math.min(92, v));
const PROJECTED = CITIES.map((c) => {
  const dx = (c.lng - CENTER_LNG) * Math.cos((CENTER_LAT * Math.PI) / 180);
  const dy = c.lat - CENTER_LAT;
  return { ...c, x: clamp(50 + dx * SCALE), y: clamp(50 - dy * SCALE) };
});

function SvgFallback() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 45%, rgba(252,251,247,0.97), rgba(238,231,220,0.97))",
      }}
    >
      <div
        aria-hidden="true"
        className="hero-dotgrid absolute inset-0 opacity-50"
        style={
          {
            "--dot-color": "rgba(20,20,19,0.10)",
            "--dot-gap": "16px",
            "--dot-r": "1px",
          } as CSSProperties
        }
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {[18, 30, 42].map((r, i) => (
          <circle
            key={r}
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke="var(--hero-clay)"
            strokeWidth={0.5}
            strokeDasharray="1.5 2"
            opacity={0.3 - i * 0.06}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <circle cx={50} cy={50} r={42} fill="var(--hero-clay)" opacity={0.05} />
        {PROJECTED.map((c) => (
          <g key={c.name}>
            <line
              x1={50}
              y1={50}
              x2={c.x}
              y2={c.y}
              stroke={DIR_VAR[c.dir]}
              strokeWidth={0.3}
              opacity={0.22}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={c.x} cy={c.y} r={1.6} fill={DIR_VAR[c.dir]} opacity={0.9} />
          </g>
        ))}
        <circle cx={50} cy={50} r={3.2} fill="var(--hero-accent)" />
      </svg>
      <span className="absolute left-1/2 top-1/2 mt-3 -translate-x-1/2 text-2xs font-semibold text-hero-accent">
        Covina
      </span>
    </div>
  );
}

export default StaticCoverageMap;
