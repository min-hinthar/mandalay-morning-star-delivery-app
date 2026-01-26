"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useAnimationPreference } from "./useAnimationPreference";

// ============================================
// TYPES
// ============================================

/** Available sound effect types */
export type SoundEffect = "click" | "success" | "error" | "pop" | "swoosh";

/** Configuration for each sound effect */
interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  /** Optional second frequency for multi-tone sounds */
  frequency2?: number;
}

// ============================================
// SOUND CONFIGURATIONS
// ============================================

/**
 * Web Audio API tone configurations
 * These generate simple synthesized sounds without external audio files
 */
const SOUND_CONFIG: Record<SoundEffect, SoundConfig> = {
  click: { frequency: 800, duration: 0.05, type: "sine" },
  success: { frequency: 600, duration: 0.1, type: "triangle", frequency2: 800 },
  error: { frequency: 200, duration: 0.15, type: "square" },
  pop: { frequency: 1000, duration: 0.03, type: "sine" },
  swoosh: { frequency: 400, duration: 0.08, type: "sawtooth" },
};

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook for playing sound effects on interactions
 *
 * Features:
 * - Web Audio API for generating simple tones (no external files needed)
 * - Respects animation preference (no sound in reduced motion)
 * - User can toggle sounds on/off (persisted to localStorage)
 * - Handles browser autoplay policy (waits for user interaction)
 * - Proper cleanup of AudioContext
 * - Multiple sound types: click, success, error, pop, swoosh
 *
 * @example
 * const { play, isEnabled, toggle } = useSoundEffect();
 *
 * <button onClick={() => { play("click"); handleClick(); }}>
 *   Click me
 * </button>
 *
 * <button onClick={toggle}>
 *   {isEnabled ? "Mute" : "Unmute"} sounds
 * </button>
 */
export function useSoundEffect() {
  const { isFullMotion } = useAnimationPreference();
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("soundEffectsEnabled") !== "false";
  });

  // Initialize AudioContext on first user interaction (browser autoplay policy)
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        // Create AudioContext lazily
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
          }
        } catch {
          // AudioContext not supported - silently fail
        }
      }
    };

    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [hasInteracted]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Silently fail on close
        });
      }
    };
  }, []);

  /**
   * Play a sound effect
   * Respects user preferences and handles errors gracefully
   */
  const play = useCallback(
    (effect: SoundEffect) => {
      // Skip if sounds disabled, reduced motion, or no interaction yet
      if (!isEnabled || !isFullMotion || !hasInteracted) return;

      const ctx = audioContextRef.current;
      if (!ctx) return;

      try {
        // Resume context if suspended (common after page visibility change)
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        const config = SOUND_CONFIG[effect];
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

        // For success sound, sweep to second frequency
        if (config.frequency2) {
          oscillator.frequency.linearRampToValueAtTime(
            config.frequency2,
            ctx.currentTime + config.duration
          );
        }

        // Fade out to avoid clicks (amplitude envelope)
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + config.duration
        );

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + config.duration);
      } catch {
        // Silently fail if audio playback fails
      }
    },
    [isEnabled, isFullMotion, hasInteracted]
  );

  /**
   * Toggle sound effects on/off
   * Persists preference to localStorage
   */
  const toggle = useCallback(() => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem("soundEffectsEnabled", String(newValue));
  }, [isEnabled]);

  /**
   * Enable sound effects
   */
  const enable = useCallback(() => {
    setIsEnabled(true);
    localStorage.setItem("soundEffectsEnabled", "true");
  }, []);

  /**
   * Disable sound effects
   */
  const disable = useCallback(() => {
    setIsEnabled(false);
    localStorage.setItem("soundEffectsEnabled", "false");
  }, []);

  return {
    /** Play a sound effect */
    play,
    /** Whether sound effects are enabled */
    isEnabled,
    /** Toggle sound effects on/off */
    toggle,
    /** Enable sound effects */
    enable,
    /** Disable sound effects */
    disable,
    /** Whether user has interacted (required for autoplay policy) */
    hasInteracted,
  };
}

// ============================================
// SIMPLE PLAY HOOK
// ============================================

/**
 * Simpler hook that just returns a play function
 * Use when you don't need toggle/enable/disable controls
 *
 * @example
 * const playSound = usePlaySound();
 * <button onClick={() => playSound("pop")}>Pop!</button>
 */
export function usePlaySound() {
  const { play } = useSoundEffect();
  return play;
}

export default useSoundEffect;
