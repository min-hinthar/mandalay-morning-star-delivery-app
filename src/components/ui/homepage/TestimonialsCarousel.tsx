"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedSection, itemVariants } from "@/components/ui/scroll";
import { NavDots } from "@/components/ui/NavDots";

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
    name: "Google Reviewer",
    location: "Covina, CA",
    rating: 5,
    text: "It's my first time trying Burmese food and HOLY smokes it's so good. Can't get such well done, healthy, and traditional Burmese food like this anywhere else in the area.",
  },
  {
    id: 2,
    name: "Google Reviewer",
    location: "San Gabriel Valley, CA",
    rating: 5,
    text: "If you're wondering how Burmese food tastes like and want to have the most authentic experience, I recommend Mandalay Morning Star.",
  },
  {
    id: 3,
    name: "Yelp Reviewer",
    location: "West Covina, CA",
    rating: 5,
    text: "Amazing atmosphere with historic pictures from Myanmar. Run by a caring family — the food is incredible and the prices are the most reasonable you can imagine.",
  },
  {
    id: 4,
    name: "Google Reviewer",
    location: "Arcadia, CA",
    rating: 5,
    text: "The tea leaf salad bursts with flavor from crunchy peanuts and aromatic fried garlic. Generous portions and so authentic — this is the real deal.",
  },
  {
    id: 5,
    name: "Yelp Reviewer",
    location: "Pasadena, CA",
    rating: 5,
    text: "The mohinga and coconut khao swe are outstanding. Voted #1 Burmese kitchen in LA for a reason — this is the dish you'll keep coming back for.",
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
        <m.div
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
        </m.div>
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
    "bg-primary text-text-inverse",
    "bg-secondary text-text-primary",
    "bg-green text-text-inverse",
    "bg-accent-orange text-text-inverse",
    "bg-accent-teal text-text-inverse",
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
        <m.div variants={itemVariants} className="text-center mb-12">
          <m.span
            className="inline-block px-4 py-2 bg-secondary/10 rounded-pill text-sm font-body font-medium text-secondary-hover mb-4"
            variants={itemVariants}
          >
            What LA Says · သုံးသပ်ချက်များ
          </m.span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            What Our Customers Say
          </h2>
          <p className="font-body text-text-secondary max-w-xl mx-auto">
            Loved by Burmese families and food lovers across Los Angeles
          </p>
        </m.div>

        {/* Carousel */}
        <m.div
          variants={itemVariants}
          className="relative bg-surface-primary rounded-card p-8 md:p-12 shadow-card border border-border"
          onMouseEnter={handlePause}
          onMouseLeave={handleResume}
          onFocus={handlePause}
          onBlur={handleResume}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={currentIndex}
              initial={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
              exit={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
              transition={{ duration: 0.3 }}
            >
              <TestimonialCard testimonial={testimonials[currentIndex]} />
            </m.div>
          </AnimatePresence>

          {/* Dot navigation */}
          <div className="flex justify-center mt-6">
            <NavDots
              total={testimonials.length}
              current={currentIndex}
              onSelect={handleDotSelect}
              labels={testimonials.map((t) => t.name)}
            />
          </div>

          {/* Pause indicator (subtle) */}
          {isPaused && shouldAnimate && !isReduced && (
            <m.div
              className="absolute top-4 right-4 text-xs font-body text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Paused
            </m.div>
          )}
        </m.div>
      </div>
    </AnimatedSection>
  );
}

export default TestimonialsCarousel;
