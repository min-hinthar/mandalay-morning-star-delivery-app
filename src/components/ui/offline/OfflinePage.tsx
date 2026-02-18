"use client";

/**
 * OfflinePage
 * Branded offline page component displayed when no cached version of a page exists.
 * Renders cached page links and a Try Again button.
 *
 * Kept lightweight (no heavy imports) since this page must work offline.
 * Uses Tailwind classes compatible with static generation.
 */

import Image from "next/image";

const CACHED_PAGES = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
] as const;

export function OfflinePage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary via-primary-hover to-primary-dark">
      {/* Brand logo */}
      <Image src="/logo.png" alt="Morning Star" width={56} height={37} className="mb-6" priority />

      {/* Offline mascot */}
      <div className="text-center mb-4" role="img" aria-label="sleeping">
        <span className="inline-block" style={{ fontSize: "5.5rem", lineHeight: 1 }}>
          {"\u{1F634}"}
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-inverse mb-2 text-center">
        You&apos;re offline
      </h1>

      {/* Subtext */}
      <p className="text-base text-text-inverse/80 mb-8 text-center max-w-md">
        It looks like you&apos;ve lost your internet connection. Here are some pages you might have
        cached:
      </p>

      {/* Cached page links */}
      <nav aria-label="Cached pages" className="mb-8 w-full max-w-xs">
        <p className="text-sm text-text-inverse/60 mb-3 text-center font-medium uppercase tracking-wide">
          Try these cached pages
        </p>
        <ul className="flex flex-col gap-2">
          {CACHED_PAGES.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="block w-full text-center py-3 px-4 rounded-xl bg-surface-primary/10 backdrop-blur-sm text-text-inverse font-medium hover:bg-surface-primary/20 transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Try Again button */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="py-3 px-8 rounded-xl bg-surface-primary text-primary font-semibold shadow-lg hover:bg-surface-primary/90 active:scale-95 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
