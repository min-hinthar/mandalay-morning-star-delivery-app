import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

const PHOTO = "/images/menu-section-bg.webp";

/**
 * AuthBrandPanel — the editorial "Morning Star" brand half of the After Dark
 * auth split. Desktop-only (`hidden lg:flex`): the appetizing menu photo
 * (`menu-section-bg.webp`, the same shot used on the menu/checkout surfaces)
 * fills the panel as a magazine-cover hero, dissolving toward the right seam
 * into the `.after-dark-canvas`, under a bottom-heavy warm scrim. The bilingual
 * wordmark + EN/MY tagline sit on the scrim.
 *
 * Text uses CONSTANT cream/gold tokens (`text-hero-card*`, `text-hero-gold`) —
 * legible over the photo scrim in both themes (theme-aware ink would meld).
 * iOS-GPU-safe: `<Image>` + gradient scrim + radial-gradient halo, no `blur()`.
 */
export function AuthBrandPanel({ className }: { className?: string }) {
  return (
    <section
      className={cn("relative hidden flex-col justify-end overflow-hidden lg:flex", className)}
    >
      {/* Appetizing menu photo — dissolves toward the right seam into the canvas */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          WebkitMaskImage: "linear-gradient(to right, #000 66%, transparent)",
          maskImage: "linear-gradient(to right, #000 66%, transparent)",
        }}
      >
        <Image
          src={PHOTO}
          alt=""
          fill
          sizes="50vw"
          quality={85}
          priority
          className="object-cover object-center"
        />
        {/* Warm legibility scrim — bottom-heavy, constant warm-dark (both themes) */}
        <div className="absolute inset-0 bg-gradient-to-t from-hero-ink/90 via-hero-ink/50 to-hero-ink/15" />
      </div>

      {/* Content */}
      <div className="relative max-w-md px-10 pb-14 pt-12 xl:px-14">
        {/* Sunburst + logo lockup */}
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-14 w-14 items-center justify-center">
            {/* Gold halo — radial-gradient falloff (no blur, iOS-safe) */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full opacity-70"
              style={{ background: "radial-gradient(circle, var(--hero-gold), transparent 66%)" }}
            />
            <HeroSunburst className="relative h-11 w-11 text-hero-gold" rays={12} />
          </span>
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={42}
            priority
            aria-hidden="true"
            className="h-11 w-auto object-contain"
          />
        </div>

        {/* Kicker — bilingual, reuses validated homepage copy */}
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-hero-gold">
          Straight from our Covina kitchen
          <span lang="my" className="font-burmese tracking-normal">
            {" "}
            · မြန်မာ အရသာ
          </span>
        </p>

        {/* Wordmark */}
        <h2 className="mt-3 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-hero-card-strong xl:text-6xl">
          Mandalay
          <br />
          Morning Star
        </h2>

        {/* Hairline */}
        <div className="mt-6 h-px w-24 bg-hero-card/40" />

        {/* Warm tagline EN + MY */}
        <p className="mt-6 text-lg leading-snug text-hero-card">
          Home-cooked Burmese, delivered across LA.
        </p>
        <p lang="my" className="mt-2 font-burmese text-base leading-relaxed text-hero-card/85">
          အိမ်ချက်ထမင်းဟင်း လွမ်းနေပြီလား · LA တစ်ခွင် အိမ်ရောက်ပို့ပေးမယ်
        </p>
      </div>
    </section>
  );
}

export default AuthBrandPanel;
