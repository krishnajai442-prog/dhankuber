"use client";

import Link from "next/link";

export function FloatingButtons() {
  return (
    <>
      <Link
        href="/contact-form"
        aria-label="Contact us"
        title="Connect with us"
        className="fixed bottom-16 right-5 z-50 rounded-xl bg-[#3ae374] p-3 shadow-lg transition-transform hover:scale-105"
      >
        <span className="relative flex items-center gap-1">
          <span className="absolute -left-3 -top-3 h-4 w-4 rounded-full bg-red-600" aria-hidden="true" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d81b60]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d81b60]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d81b60]" />
        </span>
      </Link>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="fixed bottom-4 right-5 z-50 bg-[#f2c900] px-3 py-1.5 text-sm font-bold text-red-600 shadow hover:brightness-105"
      >
        Refresh
      </button>
    </>
  );
}