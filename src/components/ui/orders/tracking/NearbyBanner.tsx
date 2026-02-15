/**
 * NearbyBanner - "Driver is almost here!" notification banner
 *
 * Slides down from top when driver ETA is <= 2 minutes.
 * Triggers haptic feedback and push notification on first appearance.
 */

"use client";

import { useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";

interface NearbyBannerProps {
  etaMinutes: number | null;
  isVisible: boolean;
}

function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function sendNearbyNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification("Almost there!", {
      body: "Your delicious meal is arriving in about 2 minutes!",
      icon: "/icons/icon-192x192.png",
    });
  } catch {
    // Notification creation failed (e.g., service worker context) -- skip
  }
}

function playNotificationSound() {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.3;
    void audio.play().catch(() => {
      // Sound file may not exist yet -- graceful failure
    });
  } catch {
    // Audio creation failed -- skip
  }
}

export function NearbyBanner({ etaMinutes, isVisible }: NearbyBannerProps) {
  const hasTriggered = useRef(false);
  const isNearby = etaMinutes !== null && etaMinutes <= 2 && isVisible;

  // Request notification permission proactively
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Trigger haptic, sound, and push notification on first appearance
  useEffect(() => {
    if (!isNearby || hasTriggered.current) return;
    hasTriggered.current = true;

    // Double-pulse haptic
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Notification sound
    playNotificationSound();

    // Push notification
    sendNearbyNotification();
  }, [isNearby]);

  return (
    <AnimatePresence>
      {isNearby && (
        <m.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="rounded-xl bg-jade-50 border border-jade-200 p-3 flex items-center gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jade-100">
            <MapPin className="h-4 w-4 text-jade-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-jade-700">
              Your driver is almost here!
            </p>
            <p className="text-xs text-jade-600">
              Arriving in about {etaMinutes} minute{etaMinutes !== 1 ? "s" : ""}
            </p>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
