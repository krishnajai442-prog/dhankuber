"use client";

import Link from "next/link";

export function DisclaimerBanner() {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-4">
      <div className="container mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-yellow-800">
        <span className="font-medium">
          <strong>DISCLAIMER:</strong> This website is an independent media portal for informational and journalistic purposes only. As a non-transactional service, we are not affiliated with any entity mentioned. Users are solely responsible for complying with all applicable laws in their jurisdiction.
        </span>
        <Link 
          href="/terms" 
          className="text-yellow-600 hover:text-yellow-700 font-medium underline hover:no-underline whitespace-nowrap"
        >
          Read More...
        </Link>
      </div>
    </div>
  );
}