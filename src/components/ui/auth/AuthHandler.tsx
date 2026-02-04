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
 * 2. Initializes Supabase client to process them (sets cookies)
 * 3. Reloads the page so server components can read the session
 */
export function AuthHandler() {
  const hasProcessed = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only run once
    if (hasProcessed.current) return;

    const handleAuthToken = async () => {
      // Check if there's a token in the URL hash
      const hash = window.location.hash;
      if (!hash || !hash.includes("access_token")) return;

      hasProcessed.current = true;
      setIsProcessing(true);

      // Initialize Supabase client - this automatically reads tokens from the hash
      const supabase = createClient();

      // Get session to process the token and set cookies
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[AuthHandler] Error processing auth token:", error);
        setIsProcessing(false);
        return;
      }

      if (session) {
        // Get the URL without the hash
        const url = new URL(window.location.href);
        url.hash = "";

        // Hard reload to the clean URL - this ensures server sees the cookies
        window.location.replace(url.toString());
      }
    };

    handleAuthToken();
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
