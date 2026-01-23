export const motionTokens = {
  duration: {
    fast: 140,
    med: 240,
    slow: 420,
  },
  ease: {
    standard: [0.2, 0.0, 0.0, 1.0],
    emphasized: [0.2, 0.8, 0.2, 1.0],
    out: [0.0, 0.0, 0.0, 1.0],
    inOut: [0.4, 0.0, 0.2, 1.0],
  },
  spring: {
    subtle: { type: "spring", stiffness: 260, damping: 26, mass: 0.9 },
    bouncy: { type: "spring", stiffness: 320, damping: 18, mass: 0.8 },
    snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  },
  stagger: {
    list: 0.04,
    grid: 0.03,
    hero: 0.08,
  },
} as const;
