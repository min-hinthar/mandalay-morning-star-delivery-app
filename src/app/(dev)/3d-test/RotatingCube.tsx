"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/**
 * Simple rotating cube for R3F setup verification
 * Uses useFrame for animation (runs every frame at 60fps)
 */
export function RotatingCube() {
  const meshRef = useRef<Mesh>(null);

  // Rotate cube every frame
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.7;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#8b1a1a" /> {/* Primary brand color */}
    </mesh>
  );
}
