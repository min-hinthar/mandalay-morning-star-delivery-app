import Image from "next/image";
import { FloatingFoodEmojis } from "./FloatingFoodEmojis";

interface ErrorPageShellProps {
  children: React.ReactNode;
}

export function ErrorPageShell({ children }: ErrorPageShellProps) {
  return (
    <div className="min-h-screen relative overflow-hidden text-text-inverse">
      {/* Animated sunset gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            "linear-gradient(-45deg, var(--hero-bg-start), var(--hero-bg-mid), var(--hero-bg-end), var(--hero-bg-start))",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Floating food emojis (decorative) */}
      <FloatingFoodEmojis />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Morning Star"
          width={56}
          height={56}
          className="mb-6"
          style={{ height: "auto" }}
          priority
        />

        {children}
      </div>
    </div>
  );
}
