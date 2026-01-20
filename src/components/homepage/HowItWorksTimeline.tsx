"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, UtensilsCrossed, CreditCard, Truck, Clock, CalendarCheck } from "lucide-react";
import {
  v6StaggerContainer,
  v6StaggerItem,
  v6ViewportOnce,
} from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
  color: string;
  bgColor: string;
}

const steps: Step[] = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Check Coverage",
    description: "Enter your address",
    detail: "We deliver within 50 miles of Covina, CA",
    color: "text-v6-primary",
    bgColor: "bg-v6-primary/10",
  },
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: "Browse & Order",
    description: "Pick your favorites",
    detail: "Authentic Burmese dishes made fresh",
    color: "text-v6-secondary-hover",
    bgColor: "bg-v6-secondary/10",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Checkout",
    description: "Secure payment",
    detail: "Order by Friday 3pm for Saturday delivery",
    color: "text-v6-green",
    bgColor: "bg-v6-green/10",
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Saturday Delivery",
    description: "Fresh to your door",
    detail: "Delivery window: 11am - 7pm",
    color: "text-v6-accent-orange",
    bgColor: "bg-v6-accent-orange/10",
  },
];

export function HowItWorksTimeline() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-v6-surface-secondary/50 to-v6-surface-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={v6StaggerContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={v6ViewportOnce.viewport}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            variants={v6StaggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-v6-primary/10 rounded-v6-pill mb-4"
          >
            <CalendarCheck className="w-4 h-4 text-v6-primary" />
            <span className="text-sm font-v6-body font-medium text-v6-primary">How It Works</span>
          </motion.div>

          <motion.h2
            variants={v6StaggerItem}
            className="font-v6-display text-3xl md:text-4xl lg:text-5xl font-bold text-v6-primary mb-4"
          >
            Order in 4 Simple Steps
          </motion.h2>

          <motion.p variants={v6StaggerItem} className="font-v6-body text-v6-text-secondary max-w-2xl mx-auto">
            From browsing our menu to receiving your meal at your doorstep, we&apos;ve made
            ordering authentic Burmese cuisine as easy as possible.
          </motion.p>
        </motion.div>

        {/* Desktop Timeline (Horizontal) */}
        <motion.div
          variants={v6StaggerContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={v6ViewportOnce.viewport}
          className="hidden md:block"
        >
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-14 left-0 right-0 h-1 bg-gradient-to-r from-v6-primary via-v6-secondary via-v6-green to-v6-accent-orange rounded-full" />

            {/* Steps */}
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={v6StaggerItem}
                  className="relative text-center"
                >
                  {/* Step Number & Icon */}
                  <div className="relative z-10 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      className={cn(
                        "w-28 h-28 rounded-full mx-auto flex items-center justify-center",
                        "bg-v6-surface-primary shadow-v6-card border-4 border-v6-surface-primary",
                        step.bgColor
                      )}
                    >
                      <div className={cn("p-3 rounded-full", step.bgColor, step.color)}>
                        {step.icon}
                      </div>
                    </motion.div>

                    {/* Step number badge */}
                    <div
                      className={cn(
                        "absolute -top-2 -right-2 w-8 h-8 rounded-full",
                        "flex items-center justify-center font-v6-body font-bold text-sm shadow-v6-md",
                        index === 0 && "bg-v6-primary text-white",
                        index === 1 && "bg-v6-secondary text-v6-text-primary",
                        index === 2 && "bg-v6-green text-white",
                        index === 3 && "bg-v6-accent-orange text-white"
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className={cn("font-v6-display text-xl font-semibold mb-2", step.color)}>
                    {step.title}
                  </h3>
                  <p className="font-v6-body font-medium text-v6-text-primary mb-1">{step.description}</p>
                  <p className="text-sm font-v6-body text-v6-text-muted">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mobile Timeline (Vertical) */}
        <motion.div
          variants={v6StaggerContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={v6ViewportOnce.viewport}
          className="md:hidden"
        >
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-v6-primary via-v6-secondary via-v6-green to-v6-accent-orange rounded-full" />

            {/* Steps */}
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={v6StaggerItem}
                  className="relative flex gap-6 pl-4"
                >
                  {/* Icon Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center",
                        "bg-v6-surface-primary shadow-v6-md border-2 border-v6-border",
                        step.bgColor
                      )}
                    >
                      <div className={step.color}>{step.icon}</div>
                    </div>

                    {/* Step number */}
                    <div
                      className={cn(
                        "absolute -top-1 -right-1 w-6 h-6 rounded-full",
                        "flex items-center justify-center font-v6-body font-bold text-xs shadow-v6-sm",
                        index === 0 && "bg-v6-primary text-white",
                        index === 1 && "bg-v6-secondary text-v6-text-primary",
                        index === 2 && "bg-v6-green text-white",
                        index === 3 && "bg-v6-accent-orange text-white"
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-2">
                    <h3 className={cn("font-v6-display text-lg font-semibold mb-1", step.color)}>
                      {step.title}
                    </h3>
                    <p className="font-v6-body font-medium text-v6-text-primary text-sm mb-1">
                      {step.description}
                    </p>
                    <p className="text-xs font-v6-body text-v6-text-muted">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cutoff Notice */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={v6ViewportOnce.viewport}
          transition={{ duration: 0.55 }}
          className="mt-12 md:mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-v6-surface-primary rounded-v6-card shadow-v6-card border border-v6-border">
            <div className="p-2 bg-v6-secondary/20 rounded-full">
              <Clock className="w-5 h-5 text-v6-secondary-hover" />
            </div>
            <div className="text-left">
              <p className="font-v6-body font-semibold text-v6-text-primary">Weekly Cutoff: Friday 3:00 PM PT</p>
              <p className="text-sm font-v6-body text-v6-text-muted">
                Orders after cutoff will be delivered next Saturday
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorksTimeline;
