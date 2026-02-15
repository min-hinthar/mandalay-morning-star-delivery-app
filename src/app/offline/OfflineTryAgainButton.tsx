"use client";

export function OfflineTryAgainButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="py-3 px-8 rounded-xl bg-surface-primary text-primary font-semibold shadow-lg hover:bg-surface-primary/90 active:scale-95 transition-all"
    >
      Try Again
    </button>
  );
}
