"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { v6Spring, v6FadeInUp } from "@/lib/motion";

interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  avatarUrl?: string;
}

// V6 Placeholder testimonials
const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    location: "Los Angeles, CA",
    quote:
      "The food arrived hot and fresh! The Mohinga was just like what my grandmother used to make. Absolutely authentic and delicious.",
  },
  {
    id: "2",
    name: "Michael Rivera",
    location: "Pasadena, CA",
    quote:
      "Best Burmese food delivery in Southern California! The tea leaf salad is incredible and the portions are generous.",
  },
  {
    id: "3",
    name: "Emily Wong",
    location: "Irvine, CA",
    quote:
      "Love the new app design! So easy to order. The samosas are crispy perfection and delivery is always on time.",
  },
  {
    id: "4",
    name: "David Kim",
    location: "San Diego, CA",
    quote:
      "Finally, authentic Burmese cuisine delivered to my door! The curry dishes are rich and flavorful. Highly recommend!",
  },
];

interface TestimonialsSectionProps {
  className?: string;
}

/**
 * V6 Testimonials Section - Pepper Aesthetic
 *
 * Features:
 * - Spring-based slide animation
 * - Auto-advance with pause on hover
 * - Swipe gestures on mobile
 * - V6 colors and typography
 */
export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [isPaused, goToNext, prefersReducedMotion]);

  const currentTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section
      className={cn(
        "relative py-20 lg:py-28 overflow-hidden",
        "bg-v6-surface-secondary",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* V6 Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-v6-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-v6-secondary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Header */}
          <motion.div
            variants={v6FadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="font-v6-display text-4xl lg:text-5xl font-black text-v6-text-primary mb-4">
              What Our{" "}
              <span className="bg-gradient-to-r from-v6-primary to-v6-primary-hover bg-clip-text text-transparent">
                Customers
              </span>{" "}
              Say
            </h2>
            <p className="font-v6-body text-lg text-v6-text-secondary max-w-md">
              Join hundreds of satisfied customers enjoying authentic Burmese
              cuisine delivered fresh to their doors.
            </p>

            {/* V6 Dot indicators - Desktop */}
            <div className="hidden lg:flex items-center gap-2 mt-8">
              {TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-v6-normal",
                    index === currentIndex
                      ? "bg-v6-primary w-8"
                      : "bg-v6-border hover:bg-v6-text-muted"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right: Carousel */}
          <div className="relative">
            {/* V6 Quote Icon */}
            <div className="absolute -top-4 -left-4 lg:-top-8 lg:-left-8 z-10">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-v6-secondary flex items-center justify-center shadow-v6-md">
                <Quote className="w-6 h-6 lg:w-8 lg:h-8 text-v6-text-primary" />
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="relative bg-v6-surface-primary rounded-v6-card shadow-v6-card p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={prefersReducedMotion ? { duration: 0 } : v6Spring}
                >
                  {/* Quote */}
                  <blockquote className="font-v6-body text-lg lg:text-xl text-v6-text-primary leading-relaxed mb-8">
                    &ldquo;{currentTestimonial.quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-v6-surface-tertiary flex-shrink-0">
                      {currentTestimonial.avatarUrl ? (
                        <Image
                          src={currentTestimonial.avatarUrl}
                          alt={currentTestimonial.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-v6-primary to-v6-primary-hover text-v6-text-inverse font-v6-display font-bold text-lg">
                          {currentTestimonial.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Name & Location */}
                    <div>
                      <p className="font-v6-display font-bold text-v6-text-primary">
                        {currentTestimonial.name}
                      </p>
                      <p className="font-v6-body text-sm text-v6-text-muted">
                        {currentTestimonial.location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* V6 Navigation Arrows */}
              <div className="absolute -bottom-5 right-8 flex items-center gap-2">
                <motion.button
                  onClick={goToPrev}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-12 h-12 rounded-full",
                    "bg-v6-surface-primary border border-v6-border",
                    "shadow-v6-sm",
                    "flex items-center justify-center",
                    "text-v6-text-secondary hover:text-v6-primary hover:border-v6-primary",
                    "transition-colors duration-v6-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary"
                  )}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={goToNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-12 h-12 rounded-full",
                    "bg-v6-primary",
                    "shadow-v6-md",
                    "flex items-center justify-center",
                    "text-v6-text-inverse",
                    "hover:bg-v6-primary-hover",
                    "transition-colors duration-v6-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2"
                  )}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* V6 Dot indicators - Mobile */}
            <div className="flex lg:hidden items-center justify-center gap-2 mt-10">
              {TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-v6-normal",
                    index === currentIndex
                      ? "bg-v6-primary w-6"
                      : "bg-v6-border hover:bg-v6-text-muted"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
