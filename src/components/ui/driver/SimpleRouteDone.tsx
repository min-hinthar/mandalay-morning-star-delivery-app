"use client";

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SimpleRouteDone() {
  const router = useRouter();

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4"
    >
      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <PartyPopper className="h-20 w-20 text-green" />
      </m.div>
      <h1 className="mt-6 font-display text-3xl font-bold text-text-primary">All Done!</h1>
      <p className="mt-2 font-body text-lg text-text-secondary">
        Great job! All deliveries complete.
      </p>
      <button
        onClick={() => router.push("/driver")}
        className={cn(
          "mt-8 flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-card-sm",
          "bg-accent-teal font-body text-lg font-semibold text-text-inverse shadow-md",
          "transition-all duration-fast hover:shadow-lg",
          "active:scale-[0.98]"
        )}
      >
        Go Home
      </button>
    </m.div>
  );
}
