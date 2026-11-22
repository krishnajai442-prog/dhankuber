import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "Dhan Kuber - Live Results & Charts",
    template: "%s | Dhan Kuber",
  },
  description: "Get the latest Dhan Kuber results, charts, and live updates for Gali, Desawar, Faridabad, Ghaziabad and more markets.",
  keywords: ["Dhan Kuber", "Satta Result", "Gali", "Desawar", "Faridabad", "Ghaziabad", "Satta Chart", "Live Result"],
  authors: [{ name: "Dhan Kuber" }],
  creator: "Dhan Kuber",
  publisher: "Dhan Kuber",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sattaking.example.com",
    siteName: "Dhan Kuber",
    title: "Dhan Kuber - Live Results & Charts",
    description: "Get the latest Dhan Kuber results, charts, and live updates for all major markets.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dhan Kuber Results",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhan Kuber - Live Results & Charts",
    description: "Get the latest Dhan Kuber results and charts.",
    images: ["/og-image.jpg"],
  },
  verification: {
    google: "google-site-verification-code",
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