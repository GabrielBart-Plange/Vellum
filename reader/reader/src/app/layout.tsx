import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ReferralTracker from "@/components/monetization/ReferralTracker";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0b0a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Vellum | Read Original Stories & Novels",
    template: "%s | Vellum"
  },
  description: "Read, write, and explore original stories and chronicles. The premier platform for digital storytelling and interactive novels.",
  applicationName: "Vellum",
  authors: [{ name: "Gabriel Bart-Plange" }],
  generator: "Next.js",
  keywords: ["reading", "writing", "novels", "stories", "interactive fiction", "paystack", "Ghana"],
  referrer: "origin-when-cross-origin",
  creator: "Vellum Operations",
  publisher: "Vellum",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://v1-vellum.vercel.app",
    siteName: "Vellum",
    title: "Vellum | Original Stories & Novels",
    description: "The archive for digital chronicles. Explore thousands of original sagas.",
    images: [
      {
        url: "https://v1-vellum.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vellum - The Scribe's Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vellum | Original Stories & Novels",
    description: "Explore the newest chronicles in the digital archive.",
    images: ["https://v1-vellum.vercel.app/twitter-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  verification: {
    google: "google-site-verification-placeholder",
  }
};

import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
