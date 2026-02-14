"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { createClient } from "@/lib/supabase/client";

interface SuccessProfile {
  name: string | null;
  avatarUrl: string | null;
}

function AuthCardContent({
  onOAuthStart,
  successProfile,
}: {
  onOAuthStart: (provider: "google" | "apple" | null) => void;
  successProfile: SuccessProfile;
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
    return <MagicLinkConfirmation email={email} onBack={handleBackToForm} />;
  }

  if (state === "success") {
    return (
      <LoginSuccessCeremony
        userName={successProfile.name}
        avatarUrl={successProfile.avatarUrl}
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
      <MagicLinkForm onSuccess={handleMagicLinkSent} />
      <SocialLoginButtons onOAuthStart={onOAuthStart} />
    </m.div>
  );
}

function AuthSessionListener({
  onSuccess,
}: {
  onSuccess: (profile: SuccessProfile) => void;
}) {
  const { setState } = useAuthCard();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) return;
        if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
        const metadata = session.user.user_metadata ?? {};
        const name =
          metadata.full_name ||
          metadata.name ||
          (session.user.email ? session.user.email.split("@")[0] : null);
        const avatarUrl = metadata.avatar_url ?? null;
        onSuccess({ name: name ?? null, avatarUrl });
        setState("success");
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [onSuccess, setState]);

  return null;
}

export function LoginPageClient() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [oauthProvider, setOauthProvider] = useState<"google" | "apple" | null>(null);
  const [successProfile, setSuccessProfile] = useState<SuccessProfile>({
    name: null,
    avatarUrl: null,
  });

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    toast({
      title: "Google sign-in didn't work",
      description: "Please try again or use the email link below.",
      variant: "destructive",
    });
  }, [searchParams, toast]);

  return (
    <>
      <OAuthLoadingOverlay provider={oauthProvider} />
      <AuthBackground>
        <AuthCard>
          <AuthSessionListener onSuccess={setSuccessProfile} />
          <AuthCardContent
            onOAuthStart={setOauthProvider}
            successProfile={successProfile}
          />
        </AuthCard>
      </AuthBackground>
    </>
  );
}
