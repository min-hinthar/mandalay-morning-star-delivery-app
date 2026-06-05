"use client";

/**
 * StaticCoverageMap — a REAL static map snapshot (Google Static Maps API) shown
 * INSTEAD of the live Google Map on low/mid mobile, which OOM-crashes low-end
 * retina iPhones. It's a single lightweight image — no WebGL context, no tile
 * cache, no markers churn — so it carries a tiny fraction of the live map's
 * memory cost while still looking like a real map (roads + a coverage circle +
 * city pins around Covina). If the Static Maps API is unavailable, it falls back
 * to a pure-SVG coverage diagram (no external dependency).
 */

import { useState, type CSSProperties } from "react";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";

type Dir = "east" | "west" | "south";

const CENTER_LAT = KITCHEN_LOCATION.lat;
const CENTER_LNG = KITCHEN_LOCATION.lng;
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

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

// Triad accent per direction (Static Maps wants 0xRRGGBB).
const DIR_HEX: Record<Dir, string> = {
  east: "0x6a9bcc",
  west: "0x788c5d",
  south: "0xd97757",
};
const DIR_VAR: Record<Dir, string> = {
  east: "var(--hero-blue)",
  west: "var(--hero-sage)",
  south: "var(--hero-clay)",
};

/** ~24-point polygon approximating the coverage circle, as Static Maps path pts. */
function circlePath(): string {
  const rLat = COVERAGE_LIMITS.maxDistanceMiles / 69; // deg latitude per mile
  const rLng = rLat / Math.cos((CENTER_LAT * Math.PI) / 180);
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const lat = CENTER_LAT + rLat * Math.cos(a);
    const lng = CENTER_LNG + rLng * Math.sin(a);
    pts.push(`${lat.toFixed(4)},${lng.toFixed(4)}`);
  }
  return pts.join("|");
}

function cityMarkers(dir: Dir): string {
  const pts = CITIES.filter((c) => c.dir === dir)
    .map((c) => `${c.lat},${c.lng}`)
    .join("|");
  return `size:tiny|color:${DIR_HEX[dir]}|${pts}`;
}

function staticMapUrl(): string {
  const center = `${CENTER_LAT},${CENTER_LNG}`;
  const params = [
    `center=${center}`,
    "zoom=9",
    "size=540x340",
    "scale=2",
    "maptype=roadmap",
    // warm, decluttered styling
    "style=feature:poi|visibility:off",
    "style=feature:transit|visibility:off",
    "style=feature:road|element:labels|visibility:off",
    "style=saturation:-22|lightness:6",
    // coverage circle
    `path=fillcolor:0xd9775720|color:0xd9775777|weight:1|${circlePath()}`,
    // kitchen + city pins
    `markers=size:mid|color:0x9a3412|${center}`,
    `markers=${cityMarkers("east")}`,
    `markers=${cityMarkers("west")}`,
    `markers=${cityMarkers("south")}`,
    `key=${KEY}`,
  ];
  return `https://maps.googleapis.com/maps/api/staticmap?${params.join("&")}`;
}

// ---- SVG fallback (no external dependency) ----

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

export function StaticCoverageMap() {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(KEY) && !imgError;

  if (!showImage) return <SvgFallback />;

  return (
    <div className="relative h-full w-full overflow-hidden bg-hero-stat-bg/40">
      {/* eslint-disable-next-line @next/next/no-img-element -- external Static
          Maps URL with onError fallback; next/image remote loader is overkill here */}
      <img
        src={staticMapUrl()}
        alt={`Delivery coverage across Greater Los Angeles — about ${COVERAGE_LIMITS.maxDistanceMiles} miles from our Covina kitchen`}
        className="h-full w-full object-cover"
        decoding="async"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default StaticCoverageMap;
