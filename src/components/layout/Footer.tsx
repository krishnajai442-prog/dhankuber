import Link from "next/link";
import { BRAND_NAME, BRAND_SHORT, BRAND_DOMAIN, BRAND_EMAIL } from "@/lib/brand";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/#mix-chart", label: "Monthly Charts" },
    { href: "/contact-form", label: "Contact / List Your Game" },
  ];

  const legal = [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/disclaimer", label: "Disclaimer" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2" aria-label={`${BRAND_NAME} Home`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c62828]">
                <span className="text-lg font-bold text-white">{BRAND_SHORT}</span>
              </div>
              <span className="text-xl font-bold text-white">{BRAND_NAME}</span>
            </Link>
            <p className="max-w-xs text-sm text-gray-400">
              {BRAND_DOMAIN} — daily satta results, monthly record charts and a full archive for Gali,
              Desawar, Faridabad, Haruf King and Ghaziabad.
            </p>
            <p className="mt-3 text-sm text-gray-400">
              <a href={`mailto:${BRAND_EMAIL}`} className="hover:text-white">{BRAND_EMAIL}</a>
            </p>
          </div>

          <nav aria-label="Quick links">
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">&copy; {currentYear} {BRAND_NAME}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Play Responsibly</span>
              <span className="text-sm font-medium text-red-500">18+</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}