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

      <main className="h-[calc(100vh-100px)]">
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
      </main>
    </div>
  );
}
