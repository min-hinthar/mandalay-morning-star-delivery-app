"use client";

import { m } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import type { MascotExpression } from "./types";

interface EyesProps {
  expression: MascotExpression;
  size: number;
  isBlinking: boolean;
}

export function Eyes({ expression, size, isBlinking }: EyesProps) {
  const eyeSize = size;
  const eyeSpacing = size * 2.5;

  // Eye shape based on expression
  const getEyeStyle = () => {
    if (isBlinking || expression === "sleeping") {
      return { scaleY: 0.1, borderRadius: "50%" };
    }

    switch (expression) {
      case "excited":
      case "celebrating":
        return { scaleY: 1.2, scaleX: 1.2 };
      case "surprised":
        return { scaleY: 1.4, scaleX: 1.4 };
      case "thinking":
        return { scaleY: 0.8, x: size * 0.3 };
      case "eating":
        return { scaleY: 0.6 };
      default:
        return { scaleY: 1, scaleX: 1 };
    }
  };

  const eyeStyle = getEyeStyle();

  return (
    <div className="flex gap-1" style={{ gap: eyeSpacing }}>
      <m.div
        className="bg-primary rounded-full"
        style={{ width: eyeSize, height: eyeSize }}
        animate={eyeStyle}
        transition={spring.snappy}
      />
      <m.div
        className="bg-primary rounded-full"
        style={{ width: eyeSize, height: eyeSize }}
        animate={eyeStyle}
        transition={spring.snappy}
      />
    </div>
  );
}
