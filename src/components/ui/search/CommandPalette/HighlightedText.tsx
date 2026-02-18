"use client";

import type { FuseResultMatch } from "fuse.js";

export interface HighlightedTextProps {
  /** Full text to display */
  text: string;
  /** Fuse.js match data with character indices */
  matches?: readonly FuseResultMatch[];
  /** Which Fuse key field to highlight (e.g. "nameEn") */
  fieldKey: string;
}

/**
 * Merge overlapping [start, end] ranges into non-overlapping sorted ranges.
 */
function mergeRanges(ranges: readonly [number, number][]): [number, number][] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current[0] <= last[1] + 1) {
      // Overlapping or adjacent -- extend
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Renders text with Fuse.js match regions highlighted.
 *
 * Extracts character-level match indices for the given fieldKey,
 * merges overlapping ranges, and wraps matched portions in <mark>
 * with an amber/yellow accent background.
 */
export function HighlightedText({ text, matches, fieldKey }: HighlightedTextProps) {
  if (!matches || matches.length === 0) {
    return <span>{text}</span>;
  }

  // Collect all index ranges for this field
  const fieldMatches = matches.filter((m) => m.key === fieldKey);
  if (fieldMatches.length === 0) {
    return <span>{text}</span>;
  }

  const allIndices: [number, number][] = fieldMatches.flatMap(
    (m) => (m.indices as [number, number][]) ?? []
  );

  const merged = mergeRanges(allIndices);
  if (merged.length === 0) {
    return <span>{text}</span>;
  }

  // Build segments: alternating plain text and highlighted spans
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of merged) {
    // Plain text before this highlight
    if (cursor < start) {
      segments.push(<span key={`plain-${cursor}`}>{text.slice(cursor, start)}</span>);
    }

    // Highlighted match
    segments.push(
      <mark
        key={`match-${start}`}
        className="bg-amber-200 dark:bg-amber-800/50 rounded-sm px-0.5 text-inherit"
      >
        {text.slice(start, end + 1)}
      </mark>
    );

    cursor = end + 1;
  }

  // Trailing plain text
  if (cursor < text.length) {
    segments.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return <span>{segments}</span>;
}

export default HighlightedText;
