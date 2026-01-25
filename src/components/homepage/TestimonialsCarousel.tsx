"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedSection, itemVariants } from "@/components/scroll/AnimatedSection";

// ============================================
// TYPES
// ============================================

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
}

// ============================================
// TESTIMONIAL DATA
// ============================================

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah M.",
    location: "Pasadena, CA",
    rating: 5,
    text: "The Tea Leaf Salad is exactly like what I had in Yangon. So authentic!",
  },
  {
    id: 2,
    name: "David L.",
    location: "Arcadia, CA",
    rating: 5,
    text: "Finally found real Mohinga in Southern California. My grandmother would approve!",
  },
  {
    id: 3,
    name: "Jennifer K.",
    location: "Covina, CA",
    rating: 5,
    text: "The Shan Noodles are incredible. Fresh, flavorful, and delivered right on time.",
  },
  {
    id: 4,
    name: "Michael T.",
    location: "Glendora, CA",
    rating: 5,
    text: "Best Burmese food delivery in the area. The samosas are always perfectly crispy.",
  },
  {
    id: 5,
    name: "Amy W.",
    location: "West Covina, CA",
    rating: 5,
    text: "Love the convenience of Saturday delivery. Perfect for our weekend family dinners!",
  },
];

// ============================================
// STAR RATING COMPONENT
// ============================================

interface StarRatingProps {
  rating: number;
}

function StarRating({ rating }: StarRatingProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => (
        <motion.div
          key={index}
          initial={shouldAnimate ? { scale: 0, rotate: -30 } : undefined}
          animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 12,
            delay: index * 0.1,
          }}
        >
          <Star
            className={cn(
              "w-4 h-4",
              index < rating ? "fill-secondary text-secondary" : "fill-border text-border"
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// AVATAR COMPONENT
// ============================================

interface AvatarProps {
  name: string;
}

function Avatar({ name }: AvatarProps) {
  const parts = name.split(" ");
  const initials = parts.map((p) => p[0]).join("");

  // Generate consistent color based on name
  const colors = [
    "bg-primary text-white",
    "bg-secondary text-text-primary",
    "bg-green text-white",
    "bg-accent-orange text-white",
    "bg-accent-teal text-white",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg",
        colors[colorIndex]
      )}
    >
      {initials}
    </div>
  );
}

// ============================================
// DOT NAVIGATION
// ============================================

interface DotNavigationProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

function DotNavigation({ total, current, onSelect }: DotNavigationProps) {
  return (
    <div className="flex gap-2 justify-center mt-6">
      {[...Array(total)].map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-300",
            index === current
              ? "bg-primary w-6"
              : "bg-border hover:bg-primary/50"
          )}
          aria-label={`Go to testimonial ${index + 1}`}
        />
      ))}
    </div>
  );
}

// ============================================
// TESTIMONIAL CARD
// ============================================

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="text-center max-w-lg mx-auto">
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-primary/20 mx-auto mb-4" />

      {/* Quote text */}
      <p className="font-body text-lg md:text-xl text-text-primary mb-6 italic">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      {/* Star rating */}
      <div className="flex justify-center mb-4">
        <StarRating rating={testimonial.rating} />
      </div>

      {/* User info */}
      <div className="flex items-center justify-center gap-3">
        <Avatar name={testimonial.name} />
        <div className="text-left">
          <p className="font-display font-semibold text-text-primary">{testimonial.name}</p>
          <p className="font-body text-sm text-text-muted">{testimonial.location}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export interface TestimonialsCarouselProps {
  className?: string;
  id?: string;
  autoRotateInterval?: number;
}

export function TestimonialsCarousel({
  className,
  id = "testimonials",
  autoRotateInterval = 5000,
}: TestimonialsCarouselProps) {
  const { shouldAnimate, isReduced } = useAnimationPreference();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotation - disabled for reduced motion
  useEffect(() => {
    // Don't auto-rotate if paused or reduced motion
    if (isPaused || isReduced || !shouldAnimate) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [isPaused, isReduced, shouldAnimate, autoRotateInterval]);

  const handleDotSelect = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <AnimatedSection
      id={id}
      className={cn(
        "py-16 md:py-24 px-4 bg-gradient-to-b from-surface-primary to-surface-secondary/50",
        className
      )}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <motion.span
            className="inline-block px-4 py-2 bg-secondary/10 rounded-pill text-sm font-body font-medium text-secondary-hover mb-4"
            variants={itemVariants}
          >
            Testimonials
          </motion.span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            What Our Customers Say
          </h2>
          <p className="font-body text-text-secondary max-w-xl mx-auto">
            Join hundreds of satisfied customers enjoying authentic Burmese cuisine
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          variants={itemVariants}
          className="relative bg-surface-primary rounded-card p-8 md:p-12 shadow-card border border-border"
          onMouseEnter={handlePause}
          onMouseLeave={handleResume}
          onFocus={handlePause}
          onBlur={handleResume}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
              exit={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
              transition={{ duration: 0.3 }}
            >
              <TestimonialCard testimonial={testimonials[currentIndex]} />
            </motion.div>
          </AnimatePresence>

          {/* Dot navigation */}
          <DotNavigation
            total={testimonials.length}
            current={currentIndex}
            onSelect={handleDotSelect}
          />

          {/* Pause indicator (subtle) */}
          {isPaused && shouldAnimate && !isReduced && (
            <motion.div
              className="absolute top-4 right-4 text-xs font-body text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Paused
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

export default TestimonialsCarousel;
