import { Img } from "@react-email/components";
import { C, DISPLAY_FONT, cls } from "./theme";

/**
 * Whether a URL is safe to render as an <img> in EMAIL across clients. Excludes:
 * - non-https,
 * - Google-Drive / Dropbox "page" links (most menu_items.image_url values) —
 *   these serve HTML, not image bytes, so they break everywhere in email,
 * - WebP (unsupported in Outlook desktop/.com).
 * Only direct raster .jpg/.jpeg/.png/.gif on https pass. Everything else falls
 * back to the elegant initial tile, so we never show a broken-image box.
 */
export function isHostableEmailImage(url?: string | null): url is string {
  if (!url || !/^https:\/\//i.test(url)) return false;
  if (/drive\.google\.com|dropbox\.com\/s\//i.test(url)) return false;
  return /\.(jpe?g|png|gif)(\?.*)?$/i.test(url);
}

interface DishThumbProps {
  imageUrl?: string | null;
  /** Dish name — drives the initial-tile fallback + alt text. */
  name: string;
  size?: number;
  /** rounding radius in px */
  radius?: number;
}

/**
 * A dish image for email: the real photo when it's a hostable raster, otherwise
 * a warm clay-tint tile with the dish's initial (Fraunces) — never a broken box.
 */
export function DishThumb({ imageUrl, name, size = 48, radius = 10 }: DishThumbProps) {
  if (isHostableEmailImage(imageUrl)) {
    return (
      <Img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
          objectFit: "cover" as const,
          display: "block",
          border: `1px solid ${C.line}`,
        }}
      />
    );
  }
  const initial = (name.trim()[0] || "★").toUpperCase();
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr>
          <td
            className={`${cls.clayTint} ${cls.clayBorder} ${cls.accent}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: `${radius}px`,
              backgroundColor: C.clayTint,
              border: `1px solid ${C.clayTintBorder}`,
              textAlign: "center" as const,
              verticalAlign: "middle" as const,
              fontFamily: DISPLAY_FONT,
              fontSize: `${Math.round(size * 0.42)}px`,
              fontWeight: 600,
              color: C.accent,
            }}
          >
            {initial}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
