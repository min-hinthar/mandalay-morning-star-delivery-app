"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { useInView } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

interface HeroVideoProps {
  /** Desktop video source (landscape) */
  desktopSrc: string;
  /** Mobile video source (portrait) */
  mobileSrc: string;
  /** Poster image for loading state and reduced motion */
  poster?: string;
  /** Overlay content (headline, CTAs) */
  children?: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Video hero component with IntersectionObserver-based pause/play.
 *
 * Features:
 * - Responsive video source switching (mobile < 768px)
 * - Muted autoplay with loop (required for mobile autoplay)
 * - Pauses when <30% visible (saves resources)
 * - Gradient overlay for text readability
 * - Reduced motion: shows poster image instead of video
 */
export function HeroVideo({
  desktopSrc,
  mobileSrc,
  poster,
  children,
  className,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  // Track if video is at least 30% visible
  const isInView = useInView(containerRef, { amount: 0.3 });

  // Track if mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect viewport size on mount and resize
  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Pause/play based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAnimate) return;

    if (isInView) {
      // Play when visible - catch errors from autoplay restrictions
      video.play().catch(() => {
        // Autoplay may be blocked by browser - user interaction required
      });
    } else {
      video.pause();
    }
  }, [isInView, shouldAnimate]);

  // Compute video source
  const videoSrc = isMobile ? mobileSrc : desktopSrc;

  // For reduced motion: show poster image only
  if (!shouldAnimate) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-[100svh] overflow-hidden",
          className
        )}
      >
        {/* Static poster image */}
        {poster && (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Overlay content */}
        {children && (
          <div className="absolute inset-0 flex flex-col justify-end">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[100svh] overflow-hidden",
        className
      )}
    >
      {/* Video player */}
      {mounted && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
          preload="metadata"
          key={videoSrc} // Force remount on source change
        >
          {/* WebM first (smaller, better compression) */}
          <source src={videoSrc} type="video/webm" />
          {/* MP4 fallback */}
          <source src={videoSrc.replace(".webm", ".mp4")} type="video/mp4" />
        </video>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Overlay content (headline, CTAs) */}
      {children && (
        <div className="absolute inset-0 flex flex-col justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
