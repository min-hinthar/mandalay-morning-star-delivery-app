"use client";

import { m } from "framer-motion";

export const CONFETTI_COLORS = [
  "#A41034", // Deep Red
  "#EBCD00", // Golden Yellow
  "#52A52E", // Green
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#FFE66D", // Bright Yellow
  "#FF9F43", // Orange
  "#A29BFE", // Purple
];

interface ConfettiParticleProps {
  color: string;
  delay: number;
}

export function ConfettiParticle({ color, delay }: ConfettiParticleProps) {
  const startX = 50 + (Math.random() - 0.5) * 20;
  const endX = startX + (Math.random() - 0.5) * 100;
  const endY = 100 + Math.random() * 50;
  const rotation = Math.random() * 1080 - 540;
  const size = 8 + Math.random() * 8;

  const shape = Math.random() > 0.5 ? "circle" : "square";

  return (
    <m.div
      className="fixed pointer-events-none"
      style={{
        left: `${startX}%`,
        top: "40%",
        width: size,
        height: shape === "circle" ? size : size * 0.6,
        backgroundColor: color,
        borderRadius: shape === "circle" ? "50%" : "2px",
      }}
      initial={{
        y: 0,
        x: 0,
        scale: 0,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        y: `${endY}vh`,
        x: `${endX - startX}vw`,
        scale: [0, 1.5, 1, 0.5, 0],
        rotate: rotation,
        opacity: [1, 1, 1, 0.8, 0],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    />
  );
}
