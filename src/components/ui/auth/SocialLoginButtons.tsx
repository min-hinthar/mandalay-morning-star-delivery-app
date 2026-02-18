"use client";

import { m } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

interface SocialLoginButtonsProps {
  onOAuthStart?: (provider: "google" | null) => void;
  /** Where to redirect after login (forwarded through auth callback) */
  redirectTo?: string;
}

export function SocialLoginButtons({ onOAuthStart, redirectTo }: SocialLoginButtonsProps) {
  const { toast } = useToast();
  const { shouldAnimate } = useAnimationPreference();

  const handleOAuth = async () => {
    onOAuthStart?.("google");
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo || "/login")}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error) {
        onOAuthStart?.(null);
        toast({
          title: "OAuth sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again";
      onOAuthStart?.(null);
      toast({
        title: "OAuth sign-in failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const buttonClass = cn(
    "w-full h-12 rounded-2xl border border-border bg-surface-primary text-text-primary",
    "flex items-center justify-center gap-3 text-sm font-medium",
    "transition-all duration-200",
    "hover:shadow-md hover:border-border-strong hover:bg-surface-secondary/50",
    "active:scale-[0.98]"
  );

  return (
    <div className="mt-6">
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-primary px-3 text-muted-foreground tracking-wider">
            or
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Google */}
        <m.button
          type="button"
          aria-label="Continue with Google"
          className={buttonClass}
          whileHover={shouldAnimate ? { y: -1 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          onClick={handleOAuth}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.637 32.54 29.23 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.843 1.154 7.957 3.043l5.657-5.657C34.051 6.053 29.224 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.649-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.843 1.154 7.957 3.043l5.657-5.657C34.051 6.053 29.224 4 24 4c-7.682 0-14.344 4.327-17.694 10.691z" />
            <path fill="#4CAF50" d="M24 44c5.151 0 9.877-1.977 13.409-5.194l-6.19-5.238C29.118 35.091 26.673 36 24 36c-5.208 0-9.607-3.432-11.257-8.149l-6.505 5.008C9.546 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.18-2.396 4.027-4.585 5.264l.002-.001 6.19 5.238C36.56 38.738 44 33.5 44 24c0-1.341-.138-2.649-.389-3.917z" />
          </svg>
          <span>Continue with Google</span>
        </m.button>
      </div>
    </div>
  );
}
