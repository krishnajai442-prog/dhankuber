"use client";

import Link from "next/link";
import { clsx } from "clsx";

interface HeaderProps {
  announcements?: {
    red?: string;
    green?: string;
  };
}

export function Header({ announcements }: HeaderProps) {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/#results", label: "Results" },
    { href: "/#charts", label: "Charts" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/contact", label: "Contact" },
    { href: "/disclaimer", label: "Disclaimer" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {announcements?.red && (
        <div className="announcement-red" role="status" aria-live="polite">
          {announcements.red}
        </div>
      )}
      {announcements?.green && (
        <div className="announcement-green" role="status" aria-live="polite">
          {announcements.green}
        </div>
      )}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" aria-label="Dhan Kuber Home">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">OK</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">Dhan Kuber</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="md:hidden">
            <button
              type="button"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open menu"
              aria-expanded="false"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}