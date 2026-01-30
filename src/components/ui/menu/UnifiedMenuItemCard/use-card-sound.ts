"use client";

import { useCallback, useRef, useEffect } from "react";

// ============================================
// TYPES
// ============================================

interface AudioState {
  context: AudioContext | null;
  initialized: boolean;
  userInteracted: boolean;
}

// ============================================
// SOUND GENERATION
// ============================================

/**
 * Generate a short click/pop sound using Web Audio API
 */
function generateClickSound(
  context: AudioContext,
  frequency: number = 800,
  duration: number = 0.08,
  volume: number = 0.3
): void {
  try {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.type = "sine";

    // Quick attack, fast decay for click feel
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + duration
    );

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  } catch (error) {
    // Silently fail - audio is non-critical
    console.debug("[useCardSound] Sound generation failed:", error);
  }
}

// ============================================
// HOOK
// ============================================

/**
 * useCardSound - Provides click sounds for card interactions
 *
 * Features:
 * - Lazy-loads Web Audio API on first user interaction
 * - Only plays sounds after first user gesture (respects autoplay policy)
 * - Short, subtle click sounds (80-100ms)
 * - Wrapped in try/catch for browsers blocking audio
 *
 * @example
 * const { playAddSound, playRemoveSound, markUserInteraction } = useCardSound();
 *
 * <button onClick={() => { markUserInteraction(); playAddSound(); addItem(); }}>
 *   Add
 * </button>
 */
export function useCardSound() {
  const audioState = useRef<AudioState>({
    context: null,
    initialized: false,
    userInteracted: false,
  });

  // Cleanup AudioContext on unmount to prevent resource leaks
  useEffect(() => {
    // Capture ref at effect setup time for cleanup
    const state = audioState;
    return () => {
      const ctx = state.current.context;
      if (ctx && ctx.state !== "closed") {
        try {
          ctx.close();
        } catch {
          // Silently fail - context may already be closed
        }
      }
      state.current.context = null;
      state.current.initialized = false;
    };
  }, []);

  /**
   * Mark that user has interacted (enables sound playback)
   * Call this on first click/tap to unlock audio
   */
  const markUserInteraction = useCallback(() => {
    audioState.current.userInteracted = true;
  }, []);

  /**
   * Initialize Web Audio context (lazy)
   */
  const initializeAudio = useCallback(() => {
    if (audioState.current.initialized) return;
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (AudioContextClass) {
        audioState.current.context = new AudioContextClass();
        audioState.current.initialized = true;
      }
    } catch (error) {
      console.debug("[useCardSound] Audio context initialization failed:", error);
    }
  }, []);

  /**
   * Resume audio context if suspended (required after user gesture)
   */
  const resumeContext = useCallback(async () => {
    const ctx = audioState.current.context;
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (error) {
        console.debug("[useCardSound] Context resume failed:", error);
      }
    }
  }, []);

  /**
   * Play add-to-cart sound (higher pitch, cheerful)
   */
  const playAddSound = useCallback(async () => {
    if (!audioState.current.userInteracted) return;

    initializeAudio();
    await resumeContext();

    const ctx = audioState.current.context;
    if (!ctx) return;

    // Higher pitch, slightly longer - cheerful add sound
    generateClickSound(ctx, 880, 0.1, 0.25);
  }, [initializeAudio, resumeContext]);

  /**
   * Play remove-from-cart sound (lower pitch, subtle)
   */
  const playRemoveSound = useCallback(async () => {
    if (!audioState.current.userInteracted) return;

    initializeAudio();
    await resumeContext();

    const ctx = audioState.current.context;
    if (!ctx) return;

    // Lower pitch, shorter - subtle remove sound
    generateClickSound(ctx, 440, 0.08, 0.2);
  }, [initializeAudio, resumeContext]);

  return {
    playAddSound,
    playRemoveSound,
    markUserInteraction,
    /** Check if sounds are enabled (user has interacted) */
    isEnabled: () => audioState.current.userInteracted,
  };
}

export default useCardSound;
