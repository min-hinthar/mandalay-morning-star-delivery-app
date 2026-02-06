"use client";

import { m } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import type { MascotExpression } from "./types";

interface MouthProps {
  expression: MascotExpression;
  size: number;
}

export function Mouth({ expression, size }: MouthProps) {
  const mouthWidth = size;
  const mouthHeight = size * 0.6;

  const getMouthPath = () => {
    switch (expression) {
      case "happy":
      case "waving":
        return (
          <m.path
            d={`M0,${mouthHeight * 0.3} Q${mouthWidth / 2},${mouthHeight} ${mouthWidth},${mouthHeight * 0.3}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        );
      case "excited":
      case "celebrating":
        return (
          <m.ellipse
            cx={mouthWidth / 2}
            cy={mouthHeight / 2}
            rx={mouthWidth * 0.4}
            ry={mouthHeight * 0.5}
            fill="currentColor"
            animate={{ ry: [mouthHeight * 0.5, mouthHeight * 0.6, mouthHeight * 0.5] }}
            transition={{ duration: 0.5, repeat: 5 }}
          />
        );
      case "surprised":
        return (
          <m.ellipse
            cx={mouthWidth / 2}
            cy={mouthHeight / 2}
            rx={mouthWidth * 0.25}
            ry={mouthHeight * 0.5}
            fill="currentColor"
            initial={{ ry: 0 }}
            animate={{ ry: mouthHeight * 0.5 }}
            transition={spring.rubbery}
          />
        );
      case "thinking":
        return (
          <m.path
            d={`M${mouthWidth * 0.2},${mouthHeight * 0.5} Q${mouthWidth * 0.5},${mouthHeight * 0.3} ${mouthWidth * 0.8},${mouthHeight * 0.5}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            animate={{ d: [
              `M${mouthWidth * 0.2},${mouthHeight * 0.5} Q${mouthWidth * 0.5},${mouthHeight * 0.3} ${mouthWidth * 0.8},${mouthHeight * 0.5}`,
              `M${mouthWidth * 0.2},${mouthHeight * 0.5} Q${mouthWidth * 0.5},${mouthHeight * 0.5} ${mouthWidth * 0.8},${mouthHeight * 0.5}`,
            ]}}
            transition={{ duration: 2, repeat: 5, ease: "easeInOut" }}
          />
        );
      case "sleeping":
        return (
          <m.path
            d={`M${mouthWidth * 0.2},${mouthHeight * 0.5} L${mouthWidth * 0.8},${mouthHeight * 0.5}`}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      case "eating":
        return (
          <m.ellipse
            cx={mouthWidth / 2}
            cy={mouthHeight / 2}
            rx={mouthWidth * 0.3}
            ry={mouthHeight * 0.4}
            fill="currentColor"
            animate={{
              ry: [mouthHeight * 0.4, mouthHeight * 0.2, mouthHeight * 0.4],
              rx: [mouthWidth * 0.3, mouthWidth * 0.35, mouthWidth * 0.3],
            }}
            transition={{ duration: 0.4, repeat: 5 }}
          />
        );
      default:
        return (
          <m.path
            d={`M0,${mouthHeight * 0.3} Q${mouthWidth / 2},${mouthHeight} ${mouthWidth},${mouthHeight * 0.3}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <svg
      width={mouthWidth}
      height={mouthHeight}
      viewBox={`0 0 ${mouthWidth} ${mouthHeight}`}
      className="text-primary"
    >
      {getMouthPath()}
    </svg>
  );
}
