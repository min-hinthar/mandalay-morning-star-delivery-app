import { cn } from "@/lib/utils/cn";
import type { BilingualText } from "@/lib/loyalty/copy";

interface BilingualProps {
  text: BilingualText;
  /** Class for the English (primary) line. */
  className?: string;
  /** Class for the Burmese (secondary) line. */
  myClassName?: string;
  /** Render inline (single line, "EN · MY") instead of stacked. */
  inline?: boolean;
}

/**
 * Renders English + Burmese together, applying `lang="my"` to the Burmese run so
 * screen readers switch voice and the Padauk font stack applies. English is the
 * primary line; Burmese sits beneath (stacked) or after a separator (inline).
 */
export function Bilingual({ text, className, myClassName, inline }: BilingualProps) {
  if (inline) {
    return (
      <span className={className}>
        {text.en}
        <span aria-hidden="true"> · </span>
        <span lang="my" className={myClassName}>
          {text.my}
        </span>
      </span>
    );
  }
  return (
    <span className={className}>
      <span>{text.en}</span>
      <span lang="my" className={cn("block", myClassName)}>
        {text.my}
      </span>
    </span>
  );
}

export default Bilingual;
