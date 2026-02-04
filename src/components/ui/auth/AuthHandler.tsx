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

  useEffect(() => {
    // Check if there's a token in the URL hash
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;
    if (hasProcessed.current) return;

    hasProcessed.current = true;
    setIsProcessing(true);

    // Initialize Supabase client
    const supabase = createClient();

    // Listen for auth state changes - this fires when the token is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AuthHandler] Auth state change:", event, !!session);

        // Handle INITIAL_SESSION (fires immediately if session exists)
        // Handle SIGNED_IN (fires after hash token is processed)
        // Handle TOKEN_REFRESHED (fires if token was refreshed)
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
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

    // Explicitly trigger session processing - this will:
    // 1. Detect the hash fragment
    // 2. Exchange tokens with Supabase
    // 3. Set cookies
    // 4. Fire the auth state change event
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("[AuthHandler] getSession:", !!data.session, error?.message);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
