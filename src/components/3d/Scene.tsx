"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";

interface SceneProps extends Omit<CanvasProps, "children"> {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * SSR-safe Canvas wrapper for React Three Fiber
 *
 * Uses mounted state check to prevent SSR hydration errors.
 * Three.js requires browser APIs (window, WebGL) that don't exist during SSR.
 *
 * Usage: Always import via dynamic() with ssr: false in page components.
 *
 * @example
 * const Scene = dynamic(() => import("@/components/3d").then(m => m.Scene), { ssr: false });
 */
export function Scene({ children, fallback = null, ...props }: SceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <Canvas {...props}>{children}</Canvas>;
}
