import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dhankuber-ruddy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dhan Kuber — Live Satta Result & Monthly Charts",
    template: "%s | Dhan Kuber",
  },
  description:
    "Dhan Kuber live results and monthly record charts for Gali, Desawar, Faridabad, Ghaziabad and all regional markets. Updated daily with full历史 archive.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Dhan Kuber",
    title: "Dhan Kuber — Live Satta Result & Monthly Charts",
    description: "Daily results and monthly charts for Gali, Desawar, Faridabad, Ghaziabad and more.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Dhan Kuber Results" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhan Kuber — Live Satta Result & Monthly Charts",
    description: "Daily results and monthly charts.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}