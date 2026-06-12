/**
 * view-transition-nav — manual View Transitions API navigation helper.
 *
 * React's `<ViewTransition>` is NOT in the npm react 19.2.3 the test runner
 * resolves, so we drive the browser API directly. Used for the cart/checkout →
 * confirmation "wax-seal" + "order-total" shared-element morphs.
 *
 * GO-WITH-GUARDS design:
 * - Unsupported browser OR `prefers-reduced-motion` → plain `router.push`.
 * - Otherwise add `vt-nav` to <html> (scopes the nav-only VT CSS, keeps it off
 *   the theme-toggle root transition), start the transition, run the push inside
 *   `startTransition`, and resolve the captured "new view ready" promise when the
 *   destination mounts (`resolveVtNavCommit`, raced with an 1800ms timeout so a
 *   slow/aborted nav can never wedge the snapshot). Clear `vt-nav` on `finished`.
 * - `wasVtNav()` lets the destination skip its own intro animation (timestamp,
 *   true within ~2.5s) so the morph isn't fighting a reveal.
 */

import { startTransition } from "react";

type RouterLike = { push: (href: string) => void };

const COMMIT_TIMEOUT_MS = 1800;
const VT_NAV_FRESH_MS = 2500;

let commitResolver: (() => void) | null = null;
let lastVtNavAt = 0;

export function isViewTransitionSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as Document & { startViewTransition?: unknown }).startViewTransition ===
      "function"
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Resolve the pending "new view ready" promise — call when the destination mounts. */
export function resolveVtNavCommit(): void {
  if (commitResolver) {
    commitResolver();
    commitResolver = null;
  }
}

/** True if the most recent navigation went through `navigateWithViewTransition` (~2.5s window). */
export function wasVtNav(): boolean {
  return typeof performance !== "undefined" && performance.now() - lastVtNavAt < VT_NAV_FRESH_MS;
}

/**
 * Navigate with a same-element View Transition when supported, else plain push.
 * The destination must mount `VtNavSync` (calls `resolveVtNavCommit` on path
 * change) so the snapshot commits as soon as the new view is in the DOM.
 */
export function navigateWithViewTransition(router: RouterLike, href: string): void {
  if (!isViewTransitionSupported() || prefersReducedMotion()) {
    router.push(href);
    return;
  }

  lastVtNavAt = performance.now();
  const root = document.documentElement;
  root.classList.add("vt-nav");

  const commitPromise = new Promise<void>((resolve) => {
    commitResolver = resolve;
    // Safety net — never let a slow/aborted nav wedge the captured snapshot.
    window.setTimeout(() => {
      resolveVtNavCommit();
      resolve();
    }, COMMIT_TIMEOUT_MS);
  });

  const transition = (
    document as Document & {
      startViewTransition: (cb: () => Promise<void>) => { finished: Promise<void> };
    }
  ).startViewTransition(async () => {
    startTransition(() => router.push(href));
    await commitPromise;
  });

  void transition.finished.finally(() => {
    root.classList.remove("vt-nav");
    commitResolver = null;
  });
}
