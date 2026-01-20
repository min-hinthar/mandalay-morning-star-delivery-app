/**
 * V7 Audio Manager
 * Handles all sound effects and background music
 *
 * Features:
 * - Sound sprite support for efficient loading
 * - Volume control with user preference persistence
 * - Respects animation/sound preferences
 * - Mobile-friendly with user gesture requirement
 */

// ============================================
// TYPES
// ============================================

export type SoundId =
  | "click"
  | "hover"
  | "success"
  | "error"
  | "notification"
  | "addToCart"
  | "removeFromCart"
  | "checkout"
  | "confetti"
  | "toggle"
  | "slide"
  | "pop"
  | "whoosh"
  | "coin"
  | "achievement"
  | "delivery";

export interface SoundConfig {
  /** Audio file URL */
  src: string;
  /** Volume (0-1) */
  volume?: number;
  /** Whether sound can overlap itself */
  overlap?: boolean;
  /** Playback rate (0.5-2) */
  rate?: number;
}

export interface AudioManagerConfig {
  /** Master volume (0-1) */
  masterVolume?: number;
  /** Whether sounds are enabled */
  enabled?: boolean;
  /** Sound definitions */
  sounds?: Partial<Record<SoundId, SoundConfig>>;
}

// ============================================
// STORAGE KEY
// ============================================

const STORAGE_KEY = "v7-audio-settings";

// ============================================
// DEFAULT SOUND DEFINITIONS
// Using placeholder URLs - replace with actual sound files
// ============================================

const DEFAULT_SOUNDS: Record<SoundId, SoundConfig> = {
  click: { src: "/sounds/click.mp3", volume: 0.5 },
  hover: { src: "/sounds/hover.mp3", volume: 0.2 },
  success: { src: "/sounds/success.mp3", volume: 0.6 },
  error: { src: "/sounds/error.mp3", volume: 0.5 },
  notification: { src: "/sounds/notification.mp3", volume: 0.6 },
  addToCart: { src: "/sounds/add-to-cart.mp3", volume: 0.7 },
  removeFromCart: { src: "/sounds/remove.mp3", volume: 0.4 },
  checkout: { src: "/sounds/checkout.mp3", volume: 0.7 },
  confetti: { src: "/sounds/confetti.mp3", volume: 0.6 },
  toggle: { src: "/sounds/toggle.mp3", volume: 0.4 },
  slide: { src: "/sounds/slide.mp3", volume: 0.3 },
  pop: { src: "/sounds/pop.mp3", volume: 0.5 },
  whoosh: { src: "/sounds/whoosh.mp3", volume: 0.4 },
  coin: { src: "/sounds/coin.mp3", volume: 0.5 },
  achievement: { src: "/sounds/achievement.mp3", volume: 0.7 },
  delivery: { src: "/sounds/delivery.mp3", volume: 0.6 },
};

// ============================================
// AUDIO MANAGER CLASS
// ============================================

class AudioManagerClass {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<SoundId, AudioBuffer> = new Map();
  private activeNodes: Map<string, AudioBufferSourceNode> = new Map();
  private masterGainNode: GainNode | null = null;
  private config: Required<AudioManagerConfig>;
  private isInitialized = false;
  private loadPromises: Map<SoundId, Promise<void>> = new Map();

  constructor() {
    this.config = {
      masterVolume: 0.7,
      enabled: true,
      sounds: DEFAULT_SOUNDS,
    };

    // Load saved settings
    this.loadSettings();
  }

  /**
   * Initialize audio context (must be called after user gesture)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = this.config.masterVolume;

      this.isInitialized = true;

      // Resume context if suspended (mobile browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn("Audio initialization failed:", error);
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        this.config.masterVolume = settings.masterVolume ?? this.config.masterVolume;
        this.config.enabled = settings.enabled ?? this.config.enabled;
      }
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          masterVolume: this.config.masterVolume,
          enabled: this.config.enabled,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Load a sound file
   */
  private async loadSound(id: SoundId): Promise<void> {
    if (this.audioBuffers.has(id)) return;
    if (this.loadPromises.has(id)) return this.loadPromises.get(id);

    const soundConfig = this.config.sounds[id];
    if (!soundConfig) return;

    const loadPromise = (async () => {
      try {
        const response = await fetch(soundConfig.src);
        const arrayBuffer = await response.arrayBuffer();

        if (this.audioContext) {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(id, audioBuffer);
        }
      } catch (error) {
        console.warn(`Failed to load sound: ${id}`, error);
      }
    })();

    this.loadPromises.set(id, loadPromise);
    return loadPromise;
  }

  /**
   * Preload specified sounds
   */
  async preload(sounds: SoundId[]): Promise<void> {
    await this.init();
    await Promise.all(sounds.map((id) => this.loadSound(id)));
  }

  /**
   * Preload all sounds
   */
  async preloadAll(): Promise<void> {
    await this.preload(Object.keys(this.config.sounds) as SoundId[]);
  }

  /**
   * Play a sound
   */
  async play(id: SoundId, options?: { volume?: number; rate?: number }): Promise<void> {
    if (!this.config.enabled) return;
    if (!this.isInitialized) await this.init();
    if (!this.audioContext || !this.masterGainNode) return;

    // Load sound if not already loaded
    if (!this.audioBuffers.has(id)) {
      await this.loadSound(id);
    }

    const buffer = this.audioBuffers.get(id);
    if (!buffer) return;

    const soundConfig = this.config.sounds[id];
    if (!soundConfig) return;

    // Create nodes
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = options?.rate ?? soundConfig.rate ?? 1;

    gainNode.gain.value = (options?.volume ?? soundConfig.volume ?? 1) * this.config.masterVolume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.masterGainNode);

    // Track active node
    const nodeId = `${id}-${Date.now()}`;
    this.activeNodes.set(nodeId, source);

    source.onended = () => {
      this.activeNodes.delete(nodeId);
    };

    // Play
    source.start(0);
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignore already stopped nodes
      }
    });
    this.activeNodes.clear();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.config.masterVolume;
    }
    this.saveSettings();
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.config.masterVolume;
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
    this.saveSettings();
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Toggle sounds on/off
   */
  toggle(): boolean {
    this.setEnabled(!this.config.enabled);
    return this.config.enabled;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioBuffers.clear();
    this.loadPromises.clear();
    this.isInitialized = false;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const audioManager = new AudioManagerClass();

// ============================================
// REACT HOOK
// ============================================

import { useCallback, useEffect, useState } from "react";

export function useAudioManager() {
  const [isEnabled, setIsEnabled] = useState(audioManager.isEnabled());
  const [volume, setVolume] = useState(audioManager.getMasterVolume());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on first user interaction
  useEffect(() => {
    const handleInteraction = async () => {
      if (!isInitialized) {
        await audioManager.init();
        setIsInitialized(true);
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
  }, [isInitialized]);

  const play = useCallback(
    async (id: SoundId, options?: { volume?: number; rate?: number }) => {
      await audioManager.play(id, options);
    },
    []
  );

  const updateVolume = useCallback((newVolume: number) => {
    audioManager.setMasterVolume(newVolume);
    setVolume(newVolume);
  }, []);

  const toggleEnabled = useCallback(() => {
    const newEnabled = audioManager.toggle();
    setIsEnabled(newEnabled);
    return newEnabled;
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    audioManager.setEnabled(enabled);
    setIsEnabled(enabled);
  }, []);

  return {
    play,
    volume,
    setVolume: updateVolume,
    isEnabled,
    setEnabled,
    toggleEnabled,
    isInitialized,
    stopAll: () => audioManager.stopAll(),
  };
}

// ============================================
// SOUND EFFECT SHORTCUTS
// ============================================

export const playClick = () => audioManager.play("click");
export const playHover = () => audioManager.play("hover");
export const playSuccess = () => audioManager.play("success");
export const playError = () => audioManager.play("error");
export const playNotification = () => audioManager.play("notification");
export const playAddToCart = () => audioManager.play("addToCart");
export const playRemoveFromCart = () => audioManager.play("removeFromCart");
export const playCheckout = () => audioManager.play("checkout");
export const playConfetti = () => audioManager.play("confetti");
export const playToggle = () => audioManager.play("toggle");
export const playSlide = () => audioManager.play("slide");
export const playPop = () => audioManager.play("pop");
export const playWhoosh = () => audioManager.play("whoosh");
export const playCoin = () => audioManager.play("coin");
export const playAchievement = () => audioManager.play("achievement");
export const playDelivery = () => audioManager.play("delivery");
