"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AuthBackground,
  AuthCard,
  LoginSuccessCeremony,
  MagicLinkForm,
  MagicLinkConfirmation,
  OAuthLoadingOverlay,
  SocialLoginButtons,
  useAuthCard,
} from "@/components/ui/auth";
import { toast } from "@/lib/hooks/useToastV8";
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { createClient } from "@/lib/supabase/client";

interface SuccessProfile {
  name: string | null;
  avatarUrl: string | null;
  redirectTo?: string;
  roleMessage?: string;
}

/** Validate that a redirect path is safe (no open redirect) */
function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

function AuthCardContent({
  onOAuthStart,
  successProfile,
  redirectTo,
}: {
  onOAuthStart: (provider: "google" | null) => void;
  successProfile: SuccessProfile;
  redirectTo?: string;
}) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { state, setState, email, setEmail, errorMessage, setErrorMessage } = useAuthCard();

  const handleMagicLinkSent = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setState("confirmation");
  };

  const handleBackToForm = () => {
    setState("form");
  };

  const handleRetry = () => {
    setErrorMessage("");
    setState("form");
  };

  if (state === "confirmation") {
    return (
      <MagicLinkConfirmation email={email} onBack={handleBackToForm} redirectTo={redirectTo} />
    );
  }

  if (state === "success") {
    return (
      <LoginSuccessCeremony
        userName={successProfile.name}
        avatarUrl={successProfile.avatarUrl}
        redirectTo={successProfile.redirectTo}
        roleMessage={successProfile.roleMessage}
      />
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          {errorMessage || "Something went wrong. Please try again."}
        </p>
        <Button type="button" onClick={handleRetry} className="w-full">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      transition={shouldAnimate ? getSpring(spring.gentle) : undefined}
      className="space-y-4"
    >
      <MagicLinkForm onSuccess={handleMagicLinkSent} redirectTo={redirectTo} />
      <SocialLoginButtons onOAuthStart={onOAuthStart} redirectTo={redirectTo} />
      <p className="text-center text-xs text-muted-foreground leading-relaxed">
        By signing in, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-2 hover:text-text-primary transition-colors"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-2 hover:text-text-primary transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </m.div>
  );
}

function AuthSessionListener({
  onSuccess,
  nextParam,
}: {
  onSuccess: (profile: SuccessProfile) => void;
  nextParam?: string;
}) {
  const { setState } = useAuthCard();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) return;
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;

      const metadata = session.user.user_metadata ?? {};
      const name =
        metadata.full_name ||
        metadata.name ||
        (session.user.email ? session.user.email.split("@")[0] : null);
      const avatarUrl = metadata.avatar_url ?? null;

      // Resolve role for redirect
      const role = metadata.role as string | undefined;
      let redirectTo = "/menu"; // default for customers
      let roleMessage = "Taking you to the menu...";

      if (role === "admin") {
        redirectTo = "/admin";
        roleMessage = "Loading your admin dashboard...";
      } else if (role === "driver") {
        redirectTo = "/driver";
        roleMessage = "Loading your driver dashboard...";
      }

      // Honor ?next= if role matches
      if (nextParam && isSafeRedirect(nextParam)) {
        if (nextParam.startsWith("/admin") && role === "admin") {
          redirectTo = nextParam;
          roleMessage = "Loading your admin dashboard...";
        } else if (nextParam.startsWith("/driver") && role === "driver") {
          redirectTo = nextParam;
          roleMessage = "Loading your driver dashboard...";
        } else if (!nextParam.startsWith("/admin") && !nextParam.startsWith("/driver")) {
          redirectTo = nextParam;
        }
      }

      onSuccess({ name: name ?? null, avatarUrl, redirectTo, roleMessage });
      setState("success");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onSuccess, setState, nextParam]);

  return null;
}

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? undefined;
  const [oauthProvider, setOauthProvider] = useState<"google" | null>(null);
  const [successProfile, setSuccessProfile] = useState<SuccessProfile>({
    name: null,
    avatarUrl: null,
    redirectTo: undefined,
    roleMessage: undefined,
  });

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    toast({
      message: "Please try again or use the email link below.",
      type: "error",
    });
  }, [searchParams]);

  return (
    <>
      <OAuthLoadingOverlay provider={oauthProvider} />
      <AuthBackground>
        <AuthCard>
          <AuthSessionListener onSuccess={setSuccessProfile} nextParam={redirectTo} />
          <AuthCardContent
            onOAuthStart={setOauthProvider}
            successProfile={successProfile}
            redirectTo={redirectTo}
          />
        </AuthCard>
      </AuthBackground>
    </>
  );
}
