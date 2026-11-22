"use client";

import { clsx } from "clsx";

interface ResultRowProps {
  chartName: string;
  result: string;
  openingResult?: string;
  closingResult?: string;
  date: number;
  month: number;
  year: number;
  isHighlighted?: boolean;
  showDate?: boolean;
  updatedAt?: string;
}

export function ResultRow({
  chartName,
  result,
  openingResult,
  closingResult,
  date,
  month,
  year,
  isHighlighted = false,
  showDate = true,
  updatedAt,
}: ResultRowProps) {
  const formattedDate = `${date.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
  const formattedUpdated = updatedAt ? new Date(updatedAt).toLocaleString() : "-";

  return (
    <tr className={clsx(isHighlighted && "highlighted")}>
      <td className="font-medium text-gray-900">{chartName}</td>
      {showDate && (
        <td className="text-gray-600 whitespace-nowrap">{formattedDate}</td>
      )}
      {openingResult && (
        <td className="text-gray-700 font-mono">{openingResult}</td>
      )}
      <td className="font-bold text-lg text-primary-700 font-mono">{result}</td>
      {closingResult && (
        <td className="text-gray-700 font-mono">{closingResult}</td>
      )}
      <td className="text-gray-500 text-sm whitespace-nowrap">{formattedUpdated}</td>
    </tr>
  );
}

export function ResultRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        </td>
      ))}
    </tr>
  );
}