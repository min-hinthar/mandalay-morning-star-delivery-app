"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/hooks/useAuth";

const REF_COOKIE = "mms_ref";
const REF_MAX_AGE_DAYS = 30;

function setRefCookie(value: string) {
  const maxAge = REF_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${REF_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getRefCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearRefCookie() {
  document.cookie = `${REF_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Captures a `?ref=CODE` referral into a cookie on landing, then — once the
 * visitor is signed in — attributes it via /api/referrals/claim (server-side
 * guards reject self-referrals, repeat claims, and existing customers).
 */
export function ReferralCapture() {
  const { isAuthenticated, isLoading } = useAuth();
  const claimed = useRef(false);

  // Stash the code as soon as we see it (survives the signup round-trip).
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setRefCookie(ref.slice(0, 32));
  }, []);

  // Attribute once authenticated.
  useEffect(() => {
    if (isLoading || !isAuthenticated || claimed.current) return;
    const code = getRefCookie();
    if (!code) return;
    claimed.current = true;

    fetch("/api/referrals/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    })
      .catch(() => {})
      .finally(clearRefCookie);
  }, [isAuthenticated, isLoading]);

  return null;
}

export default ReferralCapture;
