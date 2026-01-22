"use client";

export function CanvasBackground() {
  // Decorative canvas layer should never block clicks
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0, opacity: 0.9 }}
      aria-hidden="true"
    >
      <canvas className="h-full w-full" />
    </div>
  );
}
