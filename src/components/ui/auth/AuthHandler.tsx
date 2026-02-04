"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles auth tokens from URL fragments (magic links, OAuth)
 *
 * When Supabase sends a magic link, the token is in the URL hash:
 * /driver/onboard#access_token=...&type=magiclink
 *
 * This component:
 * 1. Detects tokens in the URL fragment
 * 2. Uses onAuthStateChange to wait for session to be established
 * 3. Reloads the page so server components can read the session cookies
 */
export function AuthHandler() {
  const hasProcessed = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a token in the URL hash
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;
    if (hasProcessed.current) return;

    hasProcessed.current = true;
    setIsProcessing(true);

    // Initialize Supabase client
    const supabase = createClient();

    // Timeout fallback - if nothing happens in 10 seconds, show error
    const timeout = setTimeout(() => {
      console.error("[AuthHandler] Timeout - session not established");
      setError("Authentication timed out. Please try clicking the link again.");
      setIsProcessing(false);
    }, 10000);

    // Listen for auth state changes - this fires when the token is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AuthHandler] Auth state change:", event, !!session, session?.user?.email);

        // Handle INITIAL_SESSION (fires immediately if session exists)
        // Handle SIGNED_IN (fires after hash token is processed)
        // Handle TOKEN_REFRESHED (fires if token was refreshed)
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
          clearTimeout(timeout);
          // Session established - reload to clean URL and let server read cookies
          const url = new URL(window.location.href);
          url.hash = "";

          // Small delay to ensure cookies are written
          setTimeout(() => {
            window.location.replace(url.toString());
          }, 100);
        }
      }
    );

    // Parse tokens from URL hash
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    console.log("[AuthHandler] Hash params:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      type: hashParams.get("type"),
    });

    if (accessToken && refreshToken) {
      // Manually set the session with tokens from hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error: sessionError }) => {
        console.log("[AuthHandler] setSession result:", !!data.session, sessionError?.message);

        if (sessionError) {
          clearTimeout(timeout);
          console.error("[AuthHandler] Session error:", sessionError);
          setError(sessionError.message);
          setIsProcessing(false);
        } else if (data.session) {
          // Session set successfully - reload to clean URL
          clearTimeout(timeout);
          const url = new URL(window.location.href);
          url.hash = "";
          window.location.replace(url.toString());
        }
      });
    } else {
      // Try getSession as fallback (in case tokens are in different format)
      supabase.auth.getSession().then(({ data, error: sessionError }) => {
        console.log("[AuthHandler] getSession:", !!data.session, sessionError?.message);

        if (sessionError) {
          clearTimeout(timeout);
          console.error("[AuthHandler] Session error:", sessionError);
          setError(sessionError.message);
          setIsProcessing(false);
        } else if (data.session) {
          clearTimeout(timeout);
          const url = new URL(window.location.href);
          url.hash = "";
          window.location.replace(url.toString());
        }
      });
    }

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center max-w-md p-4">
          <div className="text-status-error text-4xl mb-4">⚠️</div>
          <p className="text-text-primary font-medium mb-2">Authentication Failed</p>
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.hash = "";
              window.location.replace(url.toString());
            }}
            className="px-4 py-2 bg-brand-red text-text-inverse rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while processing auth token
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto mb-4" />
          <p className="text-text-secondary">Signing you in...</p>
        </div>
      </div>
    );
  }

  return null;
}
