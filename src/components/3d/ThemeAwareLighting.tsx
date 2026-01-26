"use client";

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

/**
 * Theme-Aware Lighting for 3D Scene
 *
 * Light mode: Warm studio lighting (like daytime photography)
 * Dark mode: Cool ambient lighting (like evening/night)
 *
 * Features:
 * - Smooth ~500ms lerp transitions between themes
 * - Environment preset switching (studio vs night)
 * - Adaptive contact shadows
 * - Delta-time based animation for frame-rate independence
 */
export function ThemeAwareLighting() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  // SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Target values based on theme
  const targets = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return {
      // Directional light - main key light
      directionalColor: isDark
        ? new THREE.Color('#4a5568') // Cool blue-gray
        : new THREE.Color('#fef3c7'), // Warm yellow
      directionalIntensity: isDark ? 0.3 : 1.2,

      // Ambient light - fill
      ambientColor: isDark
        ? new THREE.Color('#1e3a5f') // Deep blue
        : new THREE.Color('#fff7ed'), // Warm white
      ambientIntensity: isDark ? 0.4 : 0.5,

      // Contact shadows
      shadowOpacity: isDark ? 0.2 : 0.5,
      shadowColor: isDark ? '#4a5568' : '#000000',
      shadowBlur: isDark ? 3 : 2,
    };
  }, [resolvedTheme]);

  // Lerp lighting values every frame
  useFrame((_, delta) => {
    if (!directionalLightRef.current || !ambientLightRef.current) return;

    const lerpFactor = delta * 4; // ~250ms to reach target (4 * 0.016 = ~0.06 per frame)

    // Lerp directional light
    directionalLightRef.current.color.lerp(targets.directionalColor, lerpFactor);
    directionalLightRef.current.intensity = THREE.MathUtils.lerp(
      directionalLightRef.current.intensity,
      targets.directionalIntensity,
      lerpFactor
    );

    // Lerp ambient light
    ambientLightRef.current.color.lerp(targets.ambientColor, lerpFactor);
    ambientLightRef.current.intensity = THREE.MathUtils.lerp(
      ambientLightRef.current.intensity,
      targets.ambientIntensity,
      lerpFactor
    );
  });

  // During SSR or before mount, use light mode defaults
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <>
      {/* Key light - warm in light mode, cool in dark mode */}
      <directionalLight
        ref={directionalLightRef}
        position={[5, 5, 5]}
        color={isDark ? '#4a5568' : '#fef3c7'}
        intensity={isDark ? 0.3 : 1.2}
        castShadow
      />

      {/* Fill light - subtle ambient */}
      <ambientLight
        ref={ambientLightRef}
        color={isDark ? '#1e3a5f' : '#fff7ed'}
        intensity={isDark ? 0.4 : 0.5}
      />

      {/* Environment - HDRI lighting for reflections */}
      <Environment
        preset={isDark ? 'night' : 'studio'}
        background={false}
      />

      {/* Contact shadows - darker in light, subtle glow in dark */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={targets.shadowOpacity}
        scale={10}
        blur={targets.shadowBlur}
        color={targets.shadowColor}
      />
    </>
  );
}

export default ThemeAwareLighting;
