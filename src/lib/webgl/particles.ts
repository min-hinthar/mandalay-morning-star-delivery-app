/**
 * V7 Particle System
 * Lightweight canvas-based particle effects for hero sections
 *
 * Features:
 * - Floating particles (food elements, stars, confetti)
 * - Performance-optimized with requestAnimationFrame
 * - Respects animation preferences
 * - Lazy-loadable
 */

import { getAnimationPreference } from "../hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: ParticleType;
  life: number;
  maxLife: number;
}

export type ParticleType = "circle" | "square" | "star" | "confetti" | "food";

export interface ParticleSystemConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Maximum number of particles */
  maxParticles?: number;
  /** Particle spawn rate per second */
  spawnRate?: number;
  /** Base particle speed */
  speed?: number;
  /** Particle types to use */
  types?: ParticleType[];
  /** Color palette for particles */
  colors?: string[];
  /** Whether particles should respawn when they die */
  loop?: boolean;
  /** Gravity strength (negative for upward float) */
  gravity?: number;
  /** Wind strength (horizontal drift) */
  wind?: number;
  /** Whether to auto-start */
  autoStart?: boolean;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: Required<Omit<ParticleSystemConfig, "canvas">> = {
  maxParticles: 50,
  spawnRate: 2,
  speed: 1,
  types: ["circle", "star"],
  colors: [
    "#A41034", // Deep Red
    "#EBCD00", // Golden Yellow
    "#52A52E", // Vibrant Green
    "#E87D1E", // Warm Orange
    "#00979D", // Teal
    "#C9006B", // Magenta
  ],
  loop: true,
  gravity: -0.02,
  wind: 0.01,
  autoStart: true,
};

// ============================================
// PARTICLE SYSTEM CLASS
// ============================================

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private config: Required<Omit<ParticleSystemConfig, "canvas">>;
  private animationId: number | null = null;
  private lastSpawnTime = 0;
  private isRunning = false;

  constructor(config: ParticleSystemConfig) {
    this.canvas = config.canvas;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Set canvas size
    this.resize();

    // Auto-start if configured
    if (this.config.autoStart && getAnimationPreference() !== "none") {
      this.start();
    }
  }

  /**
   * Resize canvas to match container
   */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);
  }

  /**
   * Start the particle system
   */
  start(): void {
    if (this.isRunning) return;
    if (getAnimationPreference() === "none") return;

    this.isRunning = true;
    this.lastSpawnTime = performance.now();
    this.animate();
  }

  /**
   * Stop the particle system
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Destroy the particle system
   */
  destroy(): void {
    this.stop();
    this.clear();
  }

  /**
   * Spawn a burst of particles at a position
   */
  burst(x: number, y: number, count: number, velocity = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = velocity * (0.5 + Math.random() * 0.5);

      this.particles.push(this.createParticle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        maxLife: 60 + Math.random() * 30,
      }));
    }
  }

  /**
   * Create a single particle
   */
  private createParticle(
    x?: number,
    y?: number,
    overrides?: Partial<Particle>
  ): Particle {
    const rect = this.canvas.getBoundingClientRect();
    const type = this.config.types[Math.floor(Math.random() * this.config.types.length)];
    const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

    return {
      x: x ?? Math.random() * rect.width,
      y: y ?? rect.height + 10,
      vx: (Math.random() - 0.5) * this.config.speed,
      vy: -Math.random() * this.config.speed * 2,
      size: 4 + Math.random() * 8,
      opacity: 0.6 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      color,
      type,
      life: 0,
      maxLife: 200 + Math.random() * 100,
      ...overrides,
    };
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const rect = this.canvas.getBoundingClientRect();

    // Clear canvas
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    // Spawn new particles
    const spawnInterval = 1000 / this.config.spawnRate;
    if (
      now - this.lastSpawnTime > spawnInterval &&
      this.particles.length < this.config.maxParticles
    ) {
      this.particles.push(this.createParticle());
      this.lastSpawnTime = now;
    }

    // Update and draw particles
    this.particles = this.particles.filter((p) => {
      // Update position
      p.x += p.vx + this.config.wind;
      p.y += p.vy + this.config.gravity;
      p.rotation += p.rotationSpeed;
      p.life++;

      // Fade out near end of life
      const lifeProgress = p.life / p.maxLife;
      const fadeOpacity = lifeProgress > 0.7 ? (1 - lifeProgress) / 0.3 : 1;
      const currentOpacity = p.opacity * fadeOpacity;

      // Draw particle
      this.drawParticle(p, currentOpacity);

      // Keep particle if still alive and on screen
      const alive = p.life < p.maxLife;
      const onScreen = p.y > -50 && p.y < rect.height + 50 && p.x > -50 && p.x < rect.width + 50;

      if (!alive && this.config.loop) {
        // Respawn at bottom
        Object.assign(p, this.createParticle());
        return true;
      }

      return alive && onScreen;
    });

    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Draw a single particle
   */
  private drawParticle(p: Particle, opacity: number): void {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.globalAlpha = opacity;

    switch (p.type) {
      case "circle":
        this.drawCircle(p);
        break;
      case "square":
        this.drawSquare(p);
        break;
      case "star":
        this.drawStar(p);
        break;
      case "confetti":
        this.drawConfetti(p);
        break;
      case "food":
        this.drawFood(p);
        break;
    }

    this.ctx.restore();
  }

  private drawCircle(p: Particle): void {
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = p.color;
    this.ctx.fill();
  }

  private drawSquare(p: Particle): void {
    this.ctx.fillStyle = p.color;
    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
  }

  private drawStar(p: Particle): void {
    const spikes = 5;
    const outerRadius = p.size / 2;
    const innerRadius = p.size / 4;

    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = p.color;
    this.ctx.fill();
  }

  private drawConfetti(p: Particle): void {
    // Thin rectangle that rotates
    this.ctx.fillStyle = p.color;
    this.ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
  }

  private drawFood(p: Particle): void {
    // Simple food-like shape (circle with shadow)
    const gradient = this.ctx.createRadialGradient(
      -p.size / 6,
      -p.size / 6,
      0,
      0,
      0,
      p.size / 2
    );
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, this.darkenColor(p.color, 30));

    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }
}

// ============================================
// REACT HOOK
// ============================================

import { useEffect, useRef } from "react";

export function useParticleSystem(config: Omit<ParticleSystemConfig, "canvas">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<ParticleSystem | null>(null);

  // Initialize once on mount - config is intentionally not in deps to avoid re-creating particle system
  useEffect(() => {
    if (!canvasRef.current) return;

    systemRef.current = new ParticleSystem({
      ...config,
      canvas: canvasRef.current,
    });

    const handleResize = () => {
      systemRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      systemRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef,
    burst: (x: number, y: number, count: number) => {
      systemRef.current?.burst(x, y, count);
    },
    start: () => systemRef.current?.start(),
    stop: () => systemRef.current?.stop(),
    clear: () => systemRef.current?.clear(),
  };
}
