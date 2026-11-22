"use client";

import { ResultsTable } from "./ResultsTable";
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
}

interface ResultsSectionProps {
  title: string;
  charts: ChartData[];
  isLoading?: boolean;
  showDate?: boolean;
  id?: string;
}

export function ResultsSection({ title, charts, isLoading, showDate = true, id }: ResultsSectionProps) {
  return (
    <section id={id} className="mb-8 animate-fade-in" aria-labelledby={`${id || title.toLowerCase().replace(/\s+/g, '-')}-title`}>
      <div className="flex items-center justify-between mb-4">
        <h2 id={`${id || title.toLowerCase().replace(/\s+/g, '-')}-title`} className="section-title">
          <svg className="section-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h2>
      </div>
      <ResultsTable
        title={title}
        charts={charts}
        isLoading={isLoading}
        showDate={showDate}
      />
    </section>
  );
}

export function ResultsSectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
          </div>
          <ResultsTable
            title="Loading..."
            charts={[]}
            isLoading={true}
          />
        </div>
      ))}
    </div>
  );
}