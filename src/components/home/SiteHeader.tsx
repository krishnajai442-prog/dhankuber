import Link from "next/link";
import { BRAND_NAME, BRAND_DOMAIN } from "@/lib/brand";

interface SiteHeaderProps {
  tagline: string;
}

export function SiteHeader({ tagline }: SiteHeaderProps) {
  return (
    <header className="w-full pt-6 pb-2">
      <div className="mx-auto max-w-[1200px] px-4 text-center">
        <Link href="/" className="inline-flex items-center gap-3" aria-label={`${BRAND_NAME} Home`}>
          <span className="dragon-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.magnific.com/free-vector/vintage-strong-red-bull-head_225004-1579.jpg"
              alt={`${BRAND_NAME} logo`}
              className="dragon-img"
              draggable={false}
            />
            <span className="dragon-gloss" aria-hidden="true" />
            <span className="dragon-rim" aria-hidden="true" />
          </span>
          <span className="font-serif text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {BRAND_NAME}
            <span className="text-xl text-[#c62828] sm:text-3xl">.com</span>
          </span>
        </Link>

        <h1 className="sr-only">{BRAND_NAME} — online khiwal, live satta results and monthly charts</h1>
        <p className="mx-auto mt-4 max-w-4xl text-sm font-bold leading-relaxed text-gray-900">{tagline}</p>

        <div className="mt-4 bg-[#f0435f] px-6 py-4 text-center text-sm text-white">
          <span className="font-semibold">DISCLAIMER:</span> This website is an independent media portal for
          informational and journalistic purposes only. As a non-transactional service, we are not affiliated with
          any entity mentioned. Users are solely responsible for complying with all applicable laws in their
          jurisdiction.{" "}
          <Link href="/terms" className="text-blue-300 underline hover:text-blue-100">
            Read More...
          </Link>
        </div>
        <p className="sr-only">{BRAND_DOMAIN}</p>
      </div>
    </header>
  );
}