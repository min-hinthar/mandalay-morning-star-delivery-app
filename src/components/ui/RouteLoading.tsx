"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BrandedSpinner } from "./branded-spinner";

interface RouteLoadingProps {
  message?: string;
}

export function RouteLoading({ message = "Loading..." }: RouteLoadingProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="min-h-screen flex flex-col items-center justify-center bg-background"
      >
        <BrandedSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-text-secondary font-body text-sm"
        >
          {message}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
