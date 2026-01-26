/**
 * Theme Toggle Sound Effects
 *
 * Uses Web Audio API synthesis for nature-inspired sounds:
 * - Light mode: Bright chime (high frequency, quick decay)
 * - Dark mode: Low tone (low frequency, longer decay)
 *
 * Respects user sound preferences via localStorage.
 */

let audioContext: AudioContext | null = null;
let userHasInteracted = false;

// Track user interaction for autoplay policy
if (typeof window !== "undefined") {
  const markInteracted = () => {
    userHasInteracted = true;
  };
  window.addEventListener("click", markInteracted, { once: true });
  window.addEventListener("touchstart", markInteracted, { once: true });
  window.addEventListener("keydown", markInteracted, { once: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!userHasInteracted) return null;

  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("soundEnabled") !== "false";
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.1
): void {
  const ctx = getAudioContext();
  if (!ctx || !isSoundEnabled()) return;

  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail - audio is non-critical
  }
}

/**
 * Play bright chime for light mode activation
 * Nature-inspired: like a morning bird chirp
 */
export function playLightChime(): void {
  // Quick bright tone with harmonic
  playTone(880, 0.12, "sine", 0.08); // A5 - main
  setTimeout(() => playTone(1320, 0.1, "sine", 0.04), 30); // E6 - harmonic
}

/**
 * Play low tone for dark mode activation
 * Nature-inspired: like an evening owl hoot
 */
export function playDarkTone(): void {
  // Lower, softer tone
  playTone(220, 0.2, "sine", 0.1); // A3
}
