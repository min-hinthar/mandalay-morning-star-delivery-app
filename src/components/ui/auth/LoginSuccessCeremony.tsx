"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";

interface LoginSuccessCeremonyProps {
  userName?: string | null;
  avatarUrl?: string | null;
}

/* Sparkle ring positions — 6 sparkles evenly around the logo */
const SPARKLE_RING = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * 60) * (Math.PI / 180);
  const radius = 56;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    delay: i * 0.12,
  };
});

export function LoginSuccessCeremony({ userName, avatarUrl }: LoginSuccessCeremonyProps) {
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  useEffect(() => {
    const duration = shouldAnimate ? 2800 : 1000;
    const timeout = setTimeout(() => {
      router.replace("/");
    }, duration);

    return () => clearTimeout(timeout);
  }, [router, shouldAnimate]);

  const welcomeMessage = userName ? `Welcome, ${userName}!` : "Welcome!";

  return (
    <div className="py-8 flex flex-col items-center text-center space-y-6">
      {/* Logo with golden ring animation */}
      <div className="relative">
        {/* Expanding golden ring */}
        {shouldAnimate && (
          <m.div
            className="absolute inset-0 rounded-full border-2 border-secondary"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.6, 2], opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}

        {/* Golden glow behind */}
        <m.div
          className="absolute -inset-4 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, hsla(40, 80%, 60%, 0.5), transparent 70%)" }}
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          aria-hidden="true"
        />

        {/* Sparkle ring burst */}
        {shouldAnimate && SPARKLE_RING.map((spark, i) => (
          <m.div
            key={i}
            className="absolute top-1/2 left-1/2 text-secondary"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: spark.x,
              y: spark.y,
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 1,
              delay: 0.4 + spark.delay,
              ease: "easeOut",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2" />
          </m.div>
        ))}

        {/* Logo with shared layoutId for morph */}
        <m.div
          layoutId="app-logo"
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 25,
            duration: 2.5,
          }}
          className="relative flex items-center justify-center"
        >
          <Image
            src="/logo.png"
            alt="Mandalay Morning Star"
            width={96}
            height={96}
            priority
            className="h-24 w-24"
          />
        </m.div>
      </div>

      {/* Welcome text with avatar */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
        transition={shouldAnimate ? { ...getSpring(spring.gentle), delay: 0.5 } : undefined}
        className="flex items-center gap-3"
      >
        {avatarUrl && (
          <div className="relative">
            <div
              className="absolute -inset-0.5 rounded-full"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              aria-hidden="true"
            />
            <Image
              src={avatarUrl}
              alt={userName ? `${userName} avatar` : "User avatar"}
              width={44}
              height={44}
              unoptimized
              className="relative h-11 w-11 rounded-full object-cover"
            />
          </div>
        )}
        <p className="text-xl font-display font-bold text-text-primary">{welcomeMessage}</p>
      </m.div>

      {/* Subtitle */}
      <m.p
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-sm text-muted-foreground"
      >
        Taking you home&hellip;
      </m.p>
    </div>
  );
}
