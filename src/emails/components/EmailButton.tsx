import { Button } from "@react-email/components";
import { BODY_FONT, C } from "./theme";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  /** primary = clay book-cloth; secondary = ink-outlined paper; quiet = vellum. */
  variant?: "primary" | "secondary" | "quiet";
  fullWidth?: boolean;
  size?: "md" | "sm";
}

/**
 * Bulletproof CTA. Depth comes from a letterpress bottom edge (3px darker
 * border) instead of gradients/shadows, which Outlook would drop.
 */
export function EmailButton({
  href,
  children,
  variant = "primary",
  fullWidth = false,
  size = "md",
}: EmailButtonProps) {
  const base: React.CSSProperties = {
    fontFamily: BODY_FONT,
    fontSize: size === "md" ? "15px" : "14px",
    fontWeight: 700,
    borderRadius: "10px",
    padding: size === "md" ? "13px 30px" : "11px 20px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: fullWidth ? "block" : "inline-block",
    width: fullWidth ? "100%" : undefined,
    boxSizing: "border-box" as const,
    lineHeight: 1.2,
  };

  const variants: Record<NonNullable<EmailButtonProps["variant"]>, React.CSSProperties> = {
    primary: {
      backgroundColor: C.clay,
      color: C.white,
      border: `1px solid ${C.clayDeep}`,
      borderBottom: `3px solid ${C.clayDeep}`,
    },
    secondary: {
      backgroundColor: C.paper,
      color: C.ink,
      border: `1px solid ${C.ink}`,
      borderBottom: `3px solid ${C.ink}`,
    },
    quiet: {
      backgroundColor: C.vellum,
      color: C.accent,
      border: `1px solid ${C.lineStrong}`,
      borderBottom: `3px solid ${C.lineStrong}`,
    },
  };

  return (
    <Button href={href} style={{ ...base, ...variants[variant] }}>
      {children}
    </Button>
  );
}
