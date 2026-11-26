import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  BRAND_NAME, BRAND_DOMAIN, BRAND_EMAIL, SITE_URL,
  BRAND_TITLE, BRAND_DESCRIPTION, BRAND_KEYWORDS,
} from "@/lib/brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c62828",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND_NAME,
  title: { default: BRAND_TITLE, template: `%s | ${BRAND_NAME}` },
  description: BRAND_DESCRIPTION,
  keywords: BRAND_KEYWORDS,
  authors: [{ name: BRAND_NAME, url: SITE_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: BRAND_NAME,
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${BRAND_NAME} — live satta results` }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  // Add the real token from Google Search Console (HTML-tag method) in Vercel env.
  verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: BRAND_NAME,
      alternateName: [BRAND_DOMAIN, "Online Khaiwal", "OnlineKhiwal"],
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: BRAND_EMAIL,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: BRAND_EMAIL,
          availableLanguage: ["English", "Hindi"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND_NAME,
      description: BRAND_DESCRIPTION,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white text-gray-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}