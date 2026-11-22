"use client";

import { clsx } from "clsx";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  overlay?: boolean;
}

export function Loading({ size = "md", className, text, overlay = false }: LoadingProps) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const content = (
    <div className={clsx("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={clsx(
          "rounded-full border-primary-600 border-t-transparent animate-spin",
          sizes[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function TableLoading({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function CardLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}