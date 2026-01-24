"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamic import with SSR disabled - REQUIRED for R3F components
const Scene = dynamic(
  () => import("@/components/3d").then((m) => m.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">Loading 3D...</span>
      </div>
    ),
  }
);

// Hero3DCanvas for Phase 16-02 testing
const Hero3DCanvas = dynamic(
  () => import("@/components/3d").then((m) => m.Hero3DCanvas),
  { ssr: false }
);

// Separate component for 3D content (also client-side only)
const RotatingCube = dynamic(
  () => import("./RotatingCube").then((m) => m.RotatingCube),
  { ssr: false }
);

export default function ThreeDTestPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">3D Test Page</h1>
        <p className="text-muted-foreground">
          React Three Fiber setup verification
        </p>
      </header>

      {/* Hero3DCanvas Test Section - Phase 16-02 */}
      <section className="p-8">
        <h2 className="text-xl font-bold mb-4">Hero 3D Canvas Test</h2>
        <p className="text-muted-foreground mb-4">
          Interactive food model with OrbitControls. Drag to rotate, scroll to zoom.
        </p>
        <div className="w-full h-[400px] bg-gradient-to-br from-primary to-primary-dark rounded-lg overflow-hidden">
          <Suspense fallback={<div className="h-full animate-pulse bg-muted" />}>
            <Hero3DCanvas />
          </Suspense>
        </div>
      </section>

      {/* Original Scene Test */}
      <main className="h-[calc(100vh-400px)] min-h-[300px]">
        <h2 className="text-xl font-bold px-8 pt-4 mb-4">Original Cube Test</h2>
        <div className="h-[calc(100%-60px)]">
          <Suspense fallback={<div className="h-full animate-pulse bg-muted" />}>
            <Scene
              camera={{ position: [0, 0, 5], fov: 50 }}
              fallback={<div className="h-full animate-pulse bg-muted" />}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <RotatingCube />
            </Scene>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
