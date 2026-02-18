type ErrorType = "not-found" | "server-error" | "offline" | "default";

interface ErrorMascotProps {
  errorType: ErrorType;
}

const MASCOT_MAP: Record<ErrorType, { emoji: string; label: string }> = {
  "not-found": { emoji: "\u{1F97A}", label: "sad face" },
  "server-error": { emoji: "\u{1F92F}", label: "mind blown" },
  offline: { emoji: "\u{1F634}", label: "sleeping" },
  default: { emoji: "\u{1F635}\u200D\u{1F4AB}", label: "dizzy" },
};

export function ErrorMascot({ errorType }: ErrorMascotProps) {
  const { emoji, label } = MASCOT_MAP[errorType];

  return (
    <div className="animate-error-bob text-center" role="img" aria-label={label}>
      <span className="inline-block" style={{ fontSize: "5.5rem", lineHeight: 1 }}>
        {emoji}
      </span>
    </div>
  );
}
