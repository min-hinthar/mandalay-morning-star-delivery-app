"use client";

import { m } from "framer-motion";
import type { MascotExpression } from "./types";

interface AccessoriesProps {
  expression: MascotExpression;
  size: number;
}

export function Accessories({ expression, size }: AccessoriesProps) {
  // Thinking bubbles
  if (expression === "thinking") {
    return (
      <div className="absolute -top-2 -right-2">
        <m.div
          className="flex flex-col items-end gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <m.div
            className="w-2 h-2 rounded-full bg-secondary/60"
            animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: 5, delay: 0.3 }}
          />
          <m.div
            className="w-3 h-3 rounded-full bg-secondary/60"
            animate={{ y: [0, -2, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: 5, delay: 0.1 }}
          />
          <m.div
            className="w-4 h-4 rounded-full bg-secondary/60"
            animate={{ y: [0, -2, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: 5 }}
          />
        </m.div>
      </div>
    );
  }

  // Sleeping Zs
  if (expression === "sleeping") {
    return (
      <div className="absolute -top-4 -right-4">
        <m.div
          className="text-primary/60 font-bold"
          style={{ fontSize: size * 0.4 }}
          animate={{
            y: [0, -10, 0],
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: 5 }}
        >
          z
        </m.div>
      </div>
    );
  }

  // Celebration sparkles
  if (expression === "celebrating") {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <m.div
            key={i}
            className="absolute text-secondary"
            style={{
              top: `${-10 + Math.random() * 20}%`,
              left: `${80 + Math.random() * 30}%`,
              fontSize: size * 0.3,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1,
              repeat: 5,
              delay: i * 0.2,
            }}
          >
            ✨
          </m.div>
        ))}
      </>
    );
  }

  // Waving hand
  if (expression === "waving") {
    return (
      <m.div
        className="absolute -right-4 top-1/2 -translate-y-1/2"
        style={{ fontSize: size * 0.5 }}
        animate={{ rotate: [0, 20, -10, 20, 0] }}
        transition={{ duration: 0.8, repeat: 5 }}
      >
        👋
      </m.div>
    );
  }

  return null;
}
