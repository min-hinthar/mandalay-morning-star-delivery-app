"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

const loadDomMax = () => import("framer-motion").then((mod) => mod.domMax);

interface DomMaxProviderProps {
  children: ReactNode;
}

/**
 * Async domMax feature provider for routes needing layout animations, drag, or useAnimate.
 *
 * Wraps children with LazyMotion loading domMax asynchronously.
 * Nests inside the root domAnimation provider -- inner LazyMotion overrides outer.
 *
 * Use on: customer routes (cart drag, layoutId), admin routes (layoutId),
 * driver routes (layoutId), auth routes (layoutId, useAnimate).
 */
export function DomMaxProvider({ children }: DomMaxProviderProps) {
  return (
    <LazyMotion features={loadDomMax} strict>
      {children}
    </LazyMotion>
  );
}
