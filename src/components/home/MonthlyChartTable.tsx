"use client";

import { useEffect, useState } from "react";
import { MONTH_NAMES, yearOptions } from "@/lib/markets";

export interface MonthlyColumn { key: string; label: string; }
export interface MonthlyRow { date: number; values: Record<string, string>; red: boolean; }

interface MonthlyChartTableProps {
  title: string;
  columns: MonthlyColumn[];
  rows: MonthlyRow[];
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  latestLabel: string;
  onLatest: () => void;
  selectorLabel: string;
  selectedMonth: number;
  selectedYear: number;
  onGo: (month: number, year: number) => void;
}

export function MonthlyChartTable({
  title, columns, rows, prevLabel, nextLabel, onPrev, onNext,
  latestLabel, onLatest, selectorLabel, selectedMonth, selectedYear, onGo,
}: MonthlyChartTableProps) {
  const [m, setM] = useState(selectedMonth);
  const [y, setY] = useState(selectedYear);

  useEffect(() => {
    setM(selectedMonth);
    setY(selectedYear);
  }, [selectedMonth, selectedYear]);

  return (
    <div className="space-y-4">
      <div className="bg-[#3ed99c] px-4 py-3 text-center text-sm text-white sm:text-base">{title}</div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-center text-sm">
          <thead>
              <tr className="bg-[#f2c900] text-gray-900">
                <th className="w-16 border border-gray-300 px-2 py-2 font-bold text-[#e53935]">DATE</th>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="min-w-[120px] border border-gray-300 px-2 py-2 text-[13px] font-bold leading-tight whitespace-normal sm:text-sm"
                    title={c.label}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="border border-gray-200 bg-white px-2 py-6 text-center text-sm text-gray-600"
                >
                  No results declared yet for this month. Rows start automatically from day 1 at 12:00 AM IST.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.date} className={r.date % 2 === 0 ? "bg-[#f4f6fa]" : "bg-white"}>
                  <td className={`border border-gray-200 px-2 py-1.5 font-semibold ${r.red ? "text-[#e53935]" : "text-[#e91e63]"}`}>
                    {r.date.toString().padStart(2, "0")}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={`border border-gray-200 px-2 py-1.5 font-medium ${r.red ? "text-[#e53935]" : "text-gray-900"}`}>
                      {r.values[c.key] ?? "XX"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-x-24 gap-y-3">
        <button type="button" onClick={onPrev} className="bg-[#1565d8] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110">
          {prevLabel}
        </button>
        <button type="button" onClick={onNext} className="bg-[#1565d8] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110">
          {nextLabel}
        </button>
      </div>

      <button type="button" onClick={onLatest} className="w-full bg-[#1565d8] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110">
        {latestLabel}
      </button>

      <div className="bg-[#f2c900] px-4 py-4 text-center">
        <p className="mb-3 text-sm text-gray-900">{selectorLabel}</p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <select
            value={m}
            onChange={(e) => setM(Number(e.target.value))}
            className="flex-1 border border-gray-400 bg-white px-3 py-2.5 text-sm font-bold text-gray-900"
            aria-label="Select month"
          >
            {MONTH_NAMES.map((n, i) => (
              <option key={n} value={i + 1}>{n}</option>
            ))}
          </select>
          <select
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
            className="flex-1 border border-gray-400 bg-white px-3 py-2.5 text-sm font-bold text-gray-900"
            aria-label="Select year"
          >
            {yearOptions().map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          <button type="button" onClick={() => onGo(m, y)} className="flex-1 bg-[#1565d8] px-8 py-2.5 text-sm font-bold text-white hover:brightness-110">
            Go
          </button>
        </div>
      </div>
    </div>
  );
}