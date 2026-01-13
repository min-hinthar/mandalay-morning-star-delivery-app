import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
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
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} font-body bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
