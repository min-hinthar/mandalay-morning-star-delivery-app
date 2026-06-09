import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

/**
 * AuthBrandPanel — the editorial "Morning Star" brand half of the After Dark
 * auth split. Desktop-only (`hidden lg:flex`): a large radiating sunburst, the
 * bilingual wordmark, and a warm EN/MY tagline floating over the living ambient.
 *
 * Sits directly on the `.after-dark-canvas` (theme-aware) — so text uses
 * theme-true tokens (`text-text-*`), NOT constant hero-ink/-accent (which meld
 * on the dark canvas). The clay/gold accents are mid-tones that read on both.
 * Decorative wordmark; the form card carries the real heading + controls.
 */
export function AuthBrandPanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative hidden flex-col justify-center px-10 py-12 lg:flex xl:px-16",
        className
      )}
    >
      <div className="relative max-w-md">
        {/* Sunburst + logo lockup */}
        <div className="flex items-center gap-4">
          <span className="relative inline-flex h-16 w-16 items-center justify-center">
            {/* Warm halo — radial-gradient falloff (no blur, iOS-safe) */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full opacity-70"
              style={{
                background: "radial-gradient(circle, var(--hero-gold), transparent 68%)",
              }}
            />
            <HeroSunburst className="relative h-12 w-12 text-hero-clay" rays={12} />
          </span>
          <Image
            src="/logo.png"
            alt=""
            width={72}
            height={48}
            priority
            aria-hidden="true"
            className="h-12 w-auto object-contain opacity-90"
          />
        </div>

        {/* Kicker — bilingual, reuses validated homepage copy */}
        <p className="mt-9 text-xs font-semibold uppercase tracking-[0.22em] text-hero-clay">
          Straight from our Covina kitchen
          <span lang="my" className="font-burmese tracking-normal">
            {" "}
            · မြန်မာ အရသာ
          </span>
        </p>

        {/* Wordmark */}
        <h2 className="mt-3 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-text-primary xl:text-6xl">
          Mandalay
          <br />
          Morning Star
        </h2>

        {/* Hairline */}
        <div className="mt-6 h-px w-24 bg-border" />

        {/* Warm tagline EN + MY */}
        <p className="mt-6 text-lg leading-snug text-text-secondary">
          Home-cooked Burmese, delivered across LA.
        </p>
        <p lang="my" className="mt-2 font-burmese text-base leading-relaxed text-text-secondary">
          အိမ်ချက်ထမင်းဟင်း လွမ်းနေပြီလား · LA တစ်ခွင် အိမ်ရောက်ပို့ပေးမယ်
        </p>
      </div>
    </section>
  );
}

export default AuthBrandPanel;
