"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface LoginSuccessCeremonyProps {
  userName?: string | null;
  avatarUrl?: string | null;
}

export function LoginSuccessCeremony({ userName, avatarUrl }: LoginSuccessCeremonyProps) {
  const router = useRouter();
  const { shouldAnimate } = useAnimationPreference();

  useEffect(() => {
    const duration = shouldAnimate ? 2500 : 1000;
    const timeout = setTimeout(() => {
      router.replace("/");
    }, duration);

    return () => clearTimeout(timeout);
  }, [router, shouldAnimate]);

  const welcomeMessage = userName ? `Welcome, ${userName}!` : "Welcome!";

  return (
    <div className="py-6 flex flex-col items-center text-center space-y-6">
      <m.div
        layoutId="app-logo"
        transition={{ type: "spring", stiffness: 100, damping: 25, duration: 2.5 }}
        className="flex items-center justify-center"
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
      <m.div
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={shouldAnimate ? { opacity: 1 } : { opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3"
      >
        {avatarUrl && (
          <Image
            src={avatarUrl}
            alt={userName ? `${userName} avatar` : "User avatar"}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <p className="text-lg font-semibold text-text-primary">{welcomeMessage}</p>
      </m.div>
    </div>
  );
}
