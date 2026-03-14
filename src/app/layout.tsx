import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

import PWAGuard from "@/components/PWAGuard";

export const metadata: Metadata = {
  title: "Ghost Recovery | Premium Customer Recovery SaaS",
  description: "Recover ghost customers automatically with the power of WhatsApp.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ghost Recovery",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}
      >
        <PWAGuard>
          <div className="relative min-h-screen">
            {children}
          </div>
        </PWAGuard>
      </body>
    </html>
  );
}
