"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
 * 3. Refreshes the page so server components can read the session
 */
export function AuthHandler() {
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasProcessed.current) return;

    const handleAuthToken = async () => {
      // Check if there's a token in the URL hash
      const hash = window.location.hash;
      if (!hash || !hash.includes("access_token")) return;

      hasProcessed.current = true;

      // Initialize Supabase client - this automatically reads tokens from the hash
      const supabase = createClient();

      // Get session to process the token and set cookies
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[AuthHandler] Error processing auth token:", error);
        return;
      }

      if (session) {
        // Remove hash from URL and refresh to let server read the session cookies
        const url = new URL(window.location.href);
        url.hash = "";

        // Use replaceState to avoid adding to history, then refresh
        window.history.replaceState({}, "", url.toString());
        router.refresh();
      }
    };

    handleAuthToken();
  }, [router]);

  return null;
}
