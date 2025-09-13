import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import WoodNavbar from '@/components/WoodNavbar';
import WoodMobileNav from '@/components/WoodMobileNav';
import "./globals.css";
import "./safaricom-theme.css"; // Import custom Safaricom theme
import "./tailwind-theme.css"; // Import tailwind theme
import "./force-green.css"; // Direct element styling

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartPlanner - Project Expense Tracker",
  description: "Track project expenses and income with billing and OTP login features. Installable mobile app with offline support.",
  keywords: ["expense tracker", "project management", "income tracker", "billing", "PWA"],
  authors: [{ name: "SmartPlanner Team" }],
  creator: "SmartPlanner",
  publisher: "SmartPlanner",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartPlanner",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "SmartPlanner",
    title: "SmartPlanner - Project Expense Tracker",
    description: "Track project expenses and income with billing and OTP login features",
  },
  twitter: {
    card: "summary",
    title: "SmartPlanner - Project Expense Tracker",
    description: "Track project expenses and income with billing and OTP login features",
  },
};

export const viewport: Viewport = {
  themeColor: "#00a550", // Safaricom green
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SmartPlanner" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`bg-amber-50 font-body text-brown min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <WoodNavbar />
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
  <Toaster />
  <WoodMobileNav />
      </body>
    </html>
  );
}
