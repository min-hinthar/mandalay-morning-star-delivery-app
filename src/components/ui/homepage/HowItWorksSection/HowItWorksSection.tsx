"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { MapPin, UtensilsCrossed, Truck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedSection } from "@/components/ui/scroll";
import { InteractiveCoverageChecker } from "./InteractiveCoverageChecker";
import { Connector } from "./Connector";
import { StepCard } from "./StepCard";
import type { Step } from "./variants";

// Step data
const steps: Step[] = [
  {
    icon: MapPin,
    title: "Check Coverage",
    titleMy: "ပို့ဆောင်ရေး စစ်ဆေးမည်",
    description: "Enter your address to see if we deliver to you",
    descriptionMy: "သင့်လိပ်စာထည့်သွင်း၍ ပို့ဆောင်နိုင်မှု စစ်ဆေးပါ",
    color: "text-rose-500",
    iconBg: "bg-rose-500/25",
    iconBorder: "border-rose-400/50",
    glowColor: "rgba(244,63,94,0.5)",
  },
  {
    icon: UtensilsCrossed,
    title: "Order",
    titleMy: "မှာယူမည်",
    description: "Browse our menu and add favorites to cart",
    descriptionMy: "မီနူးကြည့်ပြီး ကြိုက်သည့်ပစ္စည်းများ ထည့်ပါ",
    color: "text-amber-500",
    iconBg: "bg-amber-500/25",
    iconBorder: "border-amber-400/50",
    glowColor: "rgba(251,191,36,0.5)",
  },
  {
    icon: Truck,
    title: "Track",
    titleMy: "ခြေရာခံမည်",
    description: "Real-time updates on your order status",
    descriptionMy: "အော်ဒါအခြေအနေကို အချိန်နှင့်တစ်ပြေးညီ ကြည့်ရှုပါ",
    color: "text-emerald-500",
    iconBg: "bg-emerald-500/25",
    iconBorder: "border-emerald-400/50",
    glowColor: "rgba(52,211,153,0.5)",
  },
  {
    icon: Sparkles,
    title: "Enjoy",
    titleMy: "ခံစားလိုက်ပါ",
    description: "Fresh Burmese cuisine delivered to your door",
    descriptionMy: "လတ်ဆတ်သော မြန်မာအစားအသောက် သင့်အိမ်တံခါးဝအထိ",
    color: "text-orange-500",
    iconBg: "bg-orange-500/25",
    iconBorder: "border-orange-400/50",
    glowColor: "rgba(251,146,60,0.5)",
  },
];

export interface HowItWorksSectionProps {
  className?: string;
  id?: string;
}

export function HowItWorksSection({ className, id = "how-it-works" }: HowItWorksSectionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <AnimatedSection
      id={id}
      className={cn("relative py-16 md:py-24 px-4 overflow-hidden", className)}
    >
      {/* Background Image */}
      <Image
        src="/images/sunset_ubein.webp"
        alt="U Bein Bridge sunset"
        fill
        sizes="100vw"
        className="object-cover object-center"
        preload={true}
        quality={85}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, transparent 0%, rgba(0,0,0,0.25) 100%)`,
        }}
      />

      {/* Top gradient */}
      <div
        className="absolute -top-1 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgb(251, 146, 60) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true }}
          transition={getSpring(spring.gentle)}
          className="text-center mb-12 md:mb-16"
        >
          <m.span
            className={cn(
              "inline-block px-5 py-2.5 rounded-full text-base font-body font-bold mb-6",
              "bg-primary text-text-inverse",
              "shadow-[0_4px_20px_rgba(164,16,52,0.4),0_0_40px_rgba(164,16,52,0.2)]",
              "border border-white/20"
            )}
            initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
            whileInView={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            viewport={{ once: true }}
            transition={getSpring(spring.default)}
          >
            How It Works · လုပ်ငန်းစဉ်
          </m.span>

          <h2
            className={cn(
              "font-display text-4xl md:text-5xl lg:text-6xl font-black mb-2 leading-tight tracking-tight",
              "text-text-primary",
              "[text-shadow:0_2px_4px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2)]"
            )}
          >
            Order in 4 Simple Steps
          </h2>
          <p
            className={cn(
              "font-body text-2xl md:text-3xl font-bold mb-4",
              "text-text-primary/80",
              "[text-shadow:0_2px_4px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]"
            )}
          >
            ရိုးရှင်းသော အဆင့် ၄ ဆင့်ဖြင့် မှာယူပါ
          </p>

          <p
            className={cn(
              "font-body max-w-xl mx-auto text-lg md:text-xl font-medium mb-1",
              "text-text-primary",
              "[text-shadow:0_1px_3px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]"
            )}
          >
            From checking delivery coverage to enjoying fresh Burmese cuisine at your door
          </p>
          <p
            className={cn(
              "font-body max-w-xl mx-auto text-base md:text-lg font-medium",
              "text-text-primary/70",
              "[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]"
            )}
          >
            ပို့ဆောင်ရေး စစ်ဆေးခြင်းမှ လတ်ဆတ်သော မြန်မာအစားအသောက် ခံစားခြင်းအထိ
          </p>
        </m.div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-5">
              <StepCard step={steps[0]} index={0}>
                <div className="mt-4 w-full">
                  <InteractiveCoverageChecker />
                </div>
              </StepCard>
            </div>

            <div className="col-span-1 flex items-center justify-center pt-24">
              <Connector index={0} orientation="horizontal" />
            </div>

            <div className="col-span-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <StepCard step={steps[1]} index={1} />
                </div>
                <Connector index={1} orientation="horizontal" />
                <div className="flex-1">
                  <StepCard step={steps[2]} index={2} />
                </div>
              </div>
              <div className="flex justify-center">
                <Connector index={2} orientation="vertical" />
              </div>
              <div className="flex justify-center">
                <div className="w-1/2">
                  <StepCard step={steps[3]} index={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <div key={step.title}>
                <StepCard step={step} index={index}>
                  {index === 0 && (
                    <div className="mt-4 w-full">
                      <InteractiveCoverageChecker />
                    </div>
                  )}
                </StepCard>
                {index < steps.length - 1 && <Connector index={index} orientation="vertical" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default HowItWorksSection;
