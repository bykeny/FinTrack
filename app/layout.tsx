import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { PinLockOverlay } from "@/components/security/PinLockOverlay";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* ─── Metadata (SEO) ─── */
export const metadata: Metadata = {
  title: {
    default: "Finance Tracker",
    template: "%s | Finance Tracker",
  },
  description:
    "Track your income, expenses, shifts, and financial goals — all in one place.",
  applicationName: "Finance Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinTrack",
  },
  formatDetection: {
    telephone: false,
  },
};

/* ─── Viewport (separate export per Next.js 14+ API) ─── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

/* ─── Root Layout ─── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            {/* Global PWA, Network & Security Overlays */}
            <OfflineBanner />
            <InstallBanner />
            <PinLockOverlay />

            {/* Scrollable content area — leaves space for bottom nav */}
            <main className="pb-20">{children}</main>

            {/* Sticky bottom navigation shell */}
            <BottomNav />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
