"use client";

/**
 * StaticCoverageMap — a lightweight, warm-paper coverage diagram for low/mid
 * mobile, shown INSTEAD of the live Google Map (which OOM-crashes low-end retina
 * iPhones). Pure SVG/CSS — no WebGL, no map tiles, no markers — so it carries
 * effectively zero GPU/memory cost while still conveying the real coverage:
 * concentric range rings around Covina with cities placed by their true bearing.
 */

import { type CSSProperties } from "react";
import { COVERAGE_LIMITS } from "@/types/address";

type Dir = "east" | "west" | "south";

// Real coordinates; direction drives the triad accent. Center ≈ Covina kitchen.
const CENTER_LAT = 34.09;
const CENTER_LNG = -117.87;
const SCALE = 52; // viewBox units per degree (≈ fits 50mi coverage in the rings)

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

const DIR_VAR: Record<Dir, string> = {
  east: "var(--hero-blue)",
  west: "var(--hero-sage)",
  south: "var(--hero-clay)",
};

const clamp = (v: number) => Math.max(6, Math.min(94, v));

const PROJECTED = CITIES.map((c) => {
  const dx = (c.lng - CENTER_LNG) * Math.cos((CENTER_LAT * Math.PI) / 180);
  const dy = c.lat - CENTER_LAT;
  return {
    ...c,
    x: clamp(50 + dx * SCALE),
    y: clamp(50 - dy * SCALE),
  };
});

export function StaticCoverageMap() {
  return (
    <div
      role="img"
      aria-label={`Delivery coverage across Greater Los Angeles — about ${COVERAGE_LIMITS.maxDistanceMiles} miles from our Covina kitchen`}
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 42%, rgba(252,251,247,0.96), rgba(243,238,229,0.96) 60%, rgba(233,224,210,0.96))",
      }}
    >
      {/* faint paper dot-grid for map texture */}
      <div
        aria-hidden="true"
        className="hero-dotgrid absolute inset-0 opacity-[0.5]"
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
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* concentric range rings around the kitchen */}
        {[18, 30, 42].map((r, i) => (
          <circle
            key={r}
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke="var(--hero-clay)"
            strokeWidth={0.4}
            strokeDasharray="1.5 2"
            opacity={0.28 - i * 0.05}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* soft coverage fill */}
        <circle cx={50} cy={50} r={42} fill="var(--hero-clay)" opacity={0.05} />

        {/* connector spokes + city dots */}
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
            <circle cx={c.x} cy={c.y} r={1.5} fill={DIR_VAR[c.dir]} opacity={0.9} />
            <circle cx={c.x} cy={c.y} r={3} fill={DIR_VAR[c.dir]} opacity={0.18} />
          </g>
        ))}

        {/* kitchen center */}
        <circle cx={50} cy={50} r={3.4} fill="var(--hero-accent)" />
        <circle
          cx={50}
          cy={50}
          r={5}
          fill="none"
          stroke="var(--hero-accent)"
          strokeWidth={0.5}
          opacity={0.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* center label */}
      <span className="absolute left-1/2 top-1/2 mt-3 -translate-x-1/2 text-2xs font-semibold text-hero-accent">
        Covina
      </span>
    </div>
  );
}

export default StaticCoverageMap;
