"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, UtensilsCrossed, CreditCard, Truck, Clock, CalendarCheck } from "lucide-react";
import { timelineContainer, timelineStep, fadeInUp, viewportSettings } from "@/lib/animations/variants";
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
    color: "text-brand-red",
    bgColor: "bg-brand-red/10",
  },
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: "Browse & Order",
    description: "Pick your favorites",
    detail: "Authentic Burmese dishes made fresh",
    color: "text-gold-dark",
    bgColor: "bg-gold/10",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Checkout",
    description: "Secure payment",
    detail: "Order by Friday 3pm for Saturday delivery",
    color: "text-jade",
    bgColor: "bg-jade/10",
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Saturday Delivery",
    description: "Fresh to your door",
    detail: "Delivery window: 11am - 7pm",
    color: "text-curry",
    bgColor: "bg-curry/10",
  },
];

export function HowItWorksTimeline() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-cream/50 to-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={timelineContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={viewportSettings}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red/10 rounded-full mb-4"
          >
            <CalendarCheck className="w-4 h-4 text-brand-red" />
            <span className="text-sm font-medium text-brand-red">How It Works</span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl text-brand-red mb-4"
          >
            Order in 4 Simple Steps
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
            From browsing our menu to receiving your meal at your doorstep, we&apos;ve made
            ordering authentic Burmese cuisine as easy as possible.
          </motion.p>
        </motion.div>

        {/* Desktop Timeline (Horizontal) */}
        <motion.div
          variants={timelineContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={viewportSettings}
          className="hidden md:block"
        >
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-14 left-0 right-0 h-1 bg-gradient-to-r from-brand-red via-gold via-jade to-curry rounded-full" />

            {/* Steps */}
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={timelineStep}
                  custom={index}
                  className="relative text-center"
                >
                  {/* Step Number & Icon */}
                  <div className="relative z-10 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "w-28 h-28 rounded-full mx-auto flex items-center justify-center",
                        "bg-white shadow-premium border-4 border-white",
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
                        "flex items-center justify-center text-white font-bold text-sm shadow-lg",
                        index === 0 && "bg-brand-red",
                        index === 1 && "bg-gold-dark",
                        index === 2 && "bg-jade",
                        index === 3 && "bg-curry"
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className={cn("font-display text-xl font-semibold mb-2", step.color)}>
                    {step.title}
                  </h3>
                  <p className="font-medium text-foreground mb-1">{step.description}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mobile Timeline (Vertical) */}
        <motion.div
          variants={timelineContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={viewportSettings}
          className="md:hidden"
        >
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-red via-gold via-jade to-curry rounded-full" />

            {/* Steps */}
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={timelineStep}
                  custom={index}
                  className="relative flex gap-6 pl-4"
                >
                  {/* Icon Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center",
                        "bg-white shadow-lg border-2",
                        step.bgColor
                      )}
                    >
                      <div className={step.color}>{step.icon}</div>
                    </div>

                    {/* Step number */}
                    <div
                      className={cn(
                        "absolute -top-1 -right-1 w-6 h-6 rounded-full",
                        "flex items-center justify-center text-white font-bold text-xs shadow-md",
                        index === 0 && "bg-brand-red",
                        index === 1 && "bg-gold-dark",
                        index === 2 && "bg-jade",
                        index === 3 && "bg-curry"
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-2">
                    <h3 className={cn("font-display text-lg font-semibold mb-1", step.color)}>
                      {step.title}
                    </h3>
                    <p className="font-medium text-foreground text-sm mb-1">
                      {step.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cutoff Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          className="mt-12 md:mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 glass rounded-2xl shadow-lg">
            <div className="p-2 bg-gold/20 rounded-full">
              <Clock className="w-5 h-5 text-gold-dark" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Weekly Cutoff: Friday 3:00 PM PT</p>
              <p className="text-sm text-muted-foreground">
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
