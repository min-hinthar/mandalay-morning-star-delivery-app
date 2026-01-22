"use client";

import { motion } from "framer-motion";
import { motionTokens } from "./motion.tokens";

export function AnimatedCard(props: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.med / 1000, ease: motionTokens.ease.standard }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      <div className="text-lg font-semibold">{props.title}</div>
      <div className="mt-1 text-sm opacity-80">{props.subtitle}</div>
    </motion.div>
  );
}
