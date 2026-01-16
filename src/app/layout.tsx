import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/app/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} font-body bg-background text-foreground antialiased`}
      >
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
