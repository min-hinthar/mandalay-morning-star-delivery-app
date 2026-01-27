import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/ui/layout/HeaderWrapper";
import { Providers } from "@/app/providers";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

/**
 * Font Optimization:
 * - Use 'swap' display for fast text rendering
 * - Preload critical font weights only
 * - Subset to latin for smaller payload
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "600", "700"], // Only critical weights
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-body bg-background text-foreground antialiased`}
      >
        <Providers>
          <ToastProvider>
            <HeaderWrapper />
            {children}
          </ToastProvider>
        </Providers>
        {/* Web Vitals monitoring - loads async, no render blocking */}
        <WebVitalsReporter />
      </body>
    </html>
  );
}
