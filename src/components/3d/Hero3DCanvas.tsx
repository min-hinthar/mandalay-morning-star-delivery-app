"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Hero3DLoader } from "./loaders/Hero3DLoader";
import { FoodModelPlaceholder } from "./models/FoodModel";
// import { FoodModel } from "./models/FoodModel"; // Uncomment when real model exists

/**
 * Hero 3D Canvas - Interactive food model showcase.
 *
 * Features:
 * - OrbitControls with inertia and constrained rotation
 * - Studio lighting via Environment
 * - Contact shadows for grounding
 * - Spring entrance animation (respects reduced motion)
 * - Touch-friendly (touch-action: none on Canvas)
 *
 * Anti-patterns avoided:
 * - No autoRotate (Phase 17 scope)
 * - No frameloop="demand" (causes choppy react-spring)
 */
export function Hero3DCanvas() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <Canvas
      style={{ touchAction: "none" }}
      gl={{
        powerPreference: "default",
        antialias: false, // Better mobile performance
      }}
      camera={{
        position: [0, 1, 4],
        fov: 50,
      }}
    >
      {/* Loading state - shown while model loads */}
      <Suspense fallback={<Hero3DLoader />}>
        {/* Food Model - using placeholder until real GLB sourced */}
        <FoodModelPlaceholder
          shouldAnimate={shouldAnimate}
          position={[0, 0, 0]}
          scale={1}
        />
        {/* Real model (uncomment when /public/models/rice-bowl.glb exists):
        <FoodModel
          url="/models/rice-bowl.glb"
          shouldAnimate={shouldAnimate}
          position={[0, 0, 0]}
          scale={1}
        />
        */}

        {/* OrbitControls - constrained rotation, zoom with limits */}
        <OrbitControls
          // Inertia/damping - drei enables by default
          enableDamping
          dampingFactor={0.05}
          // Rotation constraints - keep food "right side up"
          minPolarAngle={Math.PI / 4} // Don't go below 45deg
          maxPolarAngle={Math.PI / 2.2} // Don't go above ~82deg
          minAzimuthAngle={-Math.PI / 3} // Limit horizontal -60deg
          maxAzimuthAngle={Math.PI / 3} // Limit horizontal +60deg
          // Zoom constraints
          enableZoom
          minDistance={2}
          maxDistance={6}
          // Disable pan - only rotate and zoom
          enablePan={false}
          // Auto-rotate disabled (Phase 17 feature)
          autoRotate={false}
        />

        {/* Studio lighting - Environment handles ambient + reflections */}
        <Environment preset="studio" />

        {/* Contact shadow for grounding */}
        <ContactShadows
          opacity={0.4}
          scale={10}
          blur={2}
          position={[0, -1, 0]}
        />

        {/* Ambient fill light */}
        <ambientLight intensity={0.3} />
      </Suspense>
    </Canvas>
  );
}
