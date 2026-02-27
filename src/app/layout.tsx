import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { HeaderWrapper } from "@/components/ui/layout/HeaderWrapper";
import { Providers } from "@/app/providers";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WebVitalsReporter } from "@/lib/web-vitals";
import { OfflineIndicator, ServiceWorkerRegistration, UpdatePrompt } from "@/components/ui/offline";

/**
 * Font Optimization:
 * - Local fonts via @fontsource-variable (no build-time network dependency)
 * - Use 'swap' display for fast text rendering
 * - Latin subset only for smaller payload
 */
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  preload: true,
  weight: "100 900",
});

const playfair = localFont({
  src: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2",
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  weight: "400 700",
});

export const metadata: Metadata = {
  title: {
    default: "Mandalay Morning Star",
    template: "%s | Mandalay Morning Star",
  },
  description: "Authentic Burmese cuisine delivered every Saturday.",
  applicationName: "Mandalay Morning Star",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Mandalay Morning Star",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#8B1A1A",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins for LCP optimization */}
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-body bg-background text-foreground antialiased`}
      >
        <Providers>
          <ServiceWorkerRegistration />
          <ToastProvider>
            <OfflineIndicator />
            <HeaderWrapper />
            {children}
            <UpdatePrompt />
          </ToastProvider>
        </Providers>
        {/* Web Vitals monitoring - loads async, no render blocking */}
        <WebVitalsReporter />
        <SpeedInsights sampleRate={50} />
        <Analytics />
      </body>
    </html>
  );
}
