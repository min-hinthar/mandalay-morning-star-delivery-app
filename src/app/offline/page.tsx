import type { Metadata } from "next";
import {
  ErrorPageShell,
  ErrorMascot,
} from "@/components/ui/error-pages";
import { OfflineTryAgainButton } from "./OfflineTryAgainButton";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Offline - Mandalay Morning Star",
  description: "You appear to be offline. Try these cached pages while we reconnect.",
};

const CACHED_PAGES = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
] as const;

export default function OfflinePage() {
  return (
    <ErrorPageShell>
      <ErrorMascot errorType="offline" />
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-inverse mb-2 text-center">
        You&apos;re offline
      </h1>
      <p className="text-base text-text-inverse/80 mb-8 text-center max-w-md">
        It looks like your connection dropped. Some pages may still be available
        from cache.
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

      {/* Progressive enhancement: works as a no-op without JS, reloads with JS */}
      <OfflineTryAgainButton />
    </ErrorPageShell>
  );
}
