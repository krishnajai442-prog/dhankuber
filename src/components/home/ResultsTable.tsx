"use client";

import { ResultRow, ResultRowSkeleton } from "./ResultRow";
import { Loading } from "@/components/shared/Loading";

interface ChartData {
  id: string;
  chartName: string;
  result: string;
  openingResult?: string;
  closingResult?: string;
  date: number;
  month: number;
  year: number;
  isHighlighted: boolean;
  updatedAt?: string;
  scheduledAt?: string;
}

interface ResultsTableProps {
  title: string;
  charts: ChartData[];
  isLoading?: boolean;
  showDate?: boolean;
  emptyMessage?: string;
  highlightToday?: boolean;
}

export function ResultsTable({
  title,
  charts,
  isLoading = false,
  showDate = true,
  emptyMessage = "No results available for the selected period",
  highlightToday = false,
}: ResultsTableProps) {
  const hasOpening = charts.some((c) => c.openingResult);
  const hasClosing = charts.some((c) => c.closingResult);

  const columns = [
    { key: "chartName", label: "Market / Chart" },
    ...(showDate ? [{ key: "date", label: "Date" }] : []),
    ...(hasOpening ? [{ key: "opening", label: "Open" }] : []),
    { key: "result", label: "Result" },
    ...(hasClosing ? [{ key: "closing", label: "Close" }] : []),
    { key: "updated", label: "Last Updated" },
  ];

  if (isLoading) {
    return (
      <div className="table-container">
        <table className="table" role="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <ResultRowSkeleton key={i} columns={columns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="table-container">
        <table className="table" role="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {charts.map((chart) => (
              <ResultRow
                key={chart.id}
                chartName={chart.chartName}
                result={chart.result}
                openingResult={chart.openingResult}
                closingResult={chart.closingResult}
                date={chart.date}
                month={chart.month}
                year={chart.year}
                isHighlighted={chart.isHighlighted}
                showDate={showDate}
                updatedAt={chart.updatedAt}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}