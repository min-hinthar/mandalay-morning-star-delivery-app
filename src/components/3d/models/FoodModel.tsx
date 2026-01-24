"use client";

import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import type { Group } from "three";

interface FoodModelProps {
  url: string;
  shouldAnimate?: boolean;
  position?: [number, number, number];
  scale?: number;
}

/**
 * GLTF food model with spring scale-up entrance animation.
 * Respects shouldAnimate prop for reduced motion preference.
 */
export function FoodModel({
  url,
  shouldAnimate = true,
  position = [0, 0, 0],
  scale = 1,
}: FoodModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(url);
  const [isReady, setIsReady] = useState(false);

  // Trigger animation after model loads
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Spring scale-up entrance
  const { springScale } = useSpring({
    springScale: isReady ? scale : 0,
    from: { springScale: shouldAnimate ? 0 : scale },
    config: { tension: 200, friction: 20 },
    immediate: !shouldAnimate,
  });

  return (
    <animated.group ref={groupRef} position={position} scale={springScale}>
      <primitive object={scene.clone()} />
    </animated.group>
  );
}

interface FoodModelPlaceholderProps {
  shouldAnimate?: boolean;
  position?: [number, number, number];
  scale?: number;
}

/**
 * Temporary placeholder model for testing until real GLB is sourced.
 * Simple procedural bowl shape with rice and garnishes.
 */
export function FoodModelPlaceholder({
  shouldAnimate = true,
  position = [0, 0, 0],
  scale = 1,
}: FoodModelPlaceholderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const { springScale } = useSpring({
    springScale: isReady ? scale : 0,
    from: { springScale: shouldAnimate ? 0 : scale },
    config: { tension: 200, friction: 20 },
    immediate: !shouldAnimate,
  });

  // Simple bowl shape as placeholder
  return (
    <animated.group position={position} scale={springScale}>
      {/* Bowl base */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.5, 0.4, 32]} />
        <meshStandardMaterial color="#D4A574" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Rice/content - half sphere on top */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#FAFAFA" metalness={0} roughness={1} />
      </mesh>
      {/* Garnish dots */}
      <mesh position={[0.3, 0.3, 0.2]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#52A52E" />
      </mesh>
      <mesh position={[-0.2, 0.35, 0.3]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#A41034" />
      </mesh>
    </animated.group>
  );
}
