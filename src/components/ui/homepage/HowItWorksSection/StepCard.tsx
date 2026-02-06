"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { StepIcon } from "./StepIcon";
import { GlassCard } from "./GlassCard";
import { stepCardVariants, type Step } from "./variants";

interface StepCardProps {
  step: Step;
  index: number;
  children?: ReactNode;
}

export function StepCard({ step, index, children }: StepCardProps) {
  return (
    <m.div
      custom={index}
      variants={stepCardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="flex flex-col items-center text-center"
    >
      <GlassCard className="w-full">
        <div className="flex flex-col items-center">
          <StepIcon step={step} index={index} />

          <h3
            className={cn(
              "font-display font-extrabold text-xl md:text-2xl mt-4 mb-2",
              step.color,
              "drop-shadow-lg"
            )}
          >
            {step.title}
          </h3>

          <p className="font-body text-text-primary font-medium text-base md:text-lg max-w-[220px] drop-shadow-md">
            {step.description}
          </p>
        </div>

        {children}
      </GlassCard>
    </m.div>
  );
}
