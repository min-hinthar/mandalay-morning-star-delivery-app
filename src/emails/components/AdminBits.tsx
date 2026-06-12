import { Link, Section, Text } from "@react-email/components";
import { EmailButton } from "./EmailButton";
import { BODY_FONT, C, DISPLAY_FONT, bodyStyle, headingStyle, labelStyle } from "./theme";

/**
 * Shared building blocks for admin/ops mail — the utilitarian variant of the
 * warm-paper language: dense, scannable, data-first, zero marketing.
 */

// ─── Status pill ──────────────────────────────────────────
export type PillTone = "success" | "warn" | "error" | "info" | "neutral";

const PILL_TONES: Record<PillTone, { text: string; bg: string; border: string }> = {
  success: { text: C.sageDeep, bg: C.sageTint, border: C.sageTintBorder },
  warn: { text: C.goldDeep, bg: C.goldTint, border: C.goldTintBorder },
  error: { text: C.accentStrong, bg: C.clayTint, border: C.clayTintBorder },
  info: { text: C.blueDeep, bg: C.blueTint, border: C.blueTintBorder },
  neutral: { text: C.inkMuted, bg: C.vellum, border: C.lineStrong },
};

/** Compact status pill — deep tone text on its matching tint, 1px tint border. */
export function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  const t = PILL_TONES[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        color: t.text,
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: BODY_FONT,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

// ─── Title block ──────────────────────────────────────────
interface AdminTitleProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

/** Dense ops title: heading + optional one-line context. */
export function AdminTitle({ title, subtitle }: AdminTitleProps) {
  return (
    <Section style={{ padding: "24px 28px 0 28px" }}>
      <Text style={{ ...headingStyle(18), margin: subtitle != null ? "0 0 4px 0" : "0 0 16px 0" }}>
        {title}
      </Text>
      {subtitle != null && (
        <Text style={{ ...bodyStyle(14), margin: "0 0 16px 0" }}>{subtitle}</Text>
      )}
    </Section>
  );
}

// ─── Data panel + fields ──────────────────────────────────
/** Vellum panel that holds label/value DataFields. */
export function DataPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Section
      style={{
        margin: "0 28px 20px 28px",
        padding: "14px 18px",
        backgroundColor: C.vellum,
        border: `1px solid ${C.line}`,
        borderRadius: "10px",
        ...style,
      }}
    >
      {children}
    </Section>
  );
}

interface DataFieldProps {
  label: React.ReactNode;
  /** Drop the trailing margin on the panel's last field. */
  last?: boolean;
  bold?: boolean;
  italic?: boolean;
  children: React.ReactNode;
}

/** Tiny uppercase label over an ink value — the dense admin data row. */
export function DataField({
  label,
  last = false,
  bold = false,
  italic = false,
  children,
}: DataFieldProps) {
  return (
    <>
      <Text style={labelStyle()}>{label}</Text>
      <Text
        style={{
          fontSize: "14px",
          fontFamily: BODY_FONT,
          fontWeight: bold ? 700 : 400,
          fontStyle: italic ? ("italic" as const) : undefined,
          color: C.ink,
          lineHeight: 1.5,
          margin: last ? "0" : "0 0 12px 0",
        }}
      >
        {children}
      </Text>
    </>
  );
}

// ─── Stat tile ────────────────────────────────────────────
interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
  note?: React.ReactNode;
}

/** Summary-number cell: Fraunces figure over a tiny label. Place inside a stats <tr>. */
export function StatTile({ value, label, note }: StatTileProps) {
  return (
    <td
      style={{
        width: "50%",
        padding: "14px 12px",
        backgroundColor: C.vellum,
        border: `1px solid ${C.line}`,
        borderRadius: "10px",
        textAlign: "center" as const,
        verticalAlign: "top" as const,
      }}
    >
      <Text
        style={{
          fontSize: "24px",
          fontFamily: DISPLAY_FONT,
          fontWeight: 600,
          color: C.ink,
          margin: "0",
          lineHeight: 1.2,
        }}
      >
        {value}
      </Text>
      <Text style={{ ...labelStyle(), margin: "5px 0 0 0" }}>{label}</Text>
      {note != null && (
        <Text
          style={{
            fontSize: "11px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "3px 0 0 0",
          }}
        >
          {note}
        </Text>
      )}
    </td>
  );
}

// ─── CTA block ────────────────────────────────────────────
interface AdminCtasProps {
  primaryHref: string;
  primaryLabel: React.ReactNode;
  secondaryHref?: string;
  secondaryLabel?: React.ReactNode;
}

/** Primary EmailButton + optional quiet dashboard link, centered. */
export function AdminCtas({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: AdminCtasProps) {
  const hasSecondary = secondaryHref != null && secondaryLabel != null;
  return (
    <>
      <Section
        style={{
          padding: hasSecondary ? "22px 28px 0 28px" : "22px 28px 24px 28px",
          textAlign: "center" as const,
        }}
      >
        <EmailButton href={primaryHref}>{primaryLabel}</EmailButton>
      </Section>
      {hasSecondary && (
        <Section style={{ padding: "12px 28px 24px 28px", textAlign: "center" as const }}>
          <Link
            href={secondaryHref}
            style={{
              fontSize: "13px",
              fontFamily: BODY_FONT,
              color: C.accent,
              textDecoration: "underline",
            }}
          >
            {secondaryLabel}
          </Link>
        </Section>
      )}
    </>
  );
}
