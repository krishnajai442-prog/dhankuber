"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
  disabled?: boolean;
  label?: string;
  showMonth?: boolean;
  selectedMonth?: number;
  onMonthChange?: (month: number) => void;
  availableMonths?: number[];
}

const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" },
];

export function YearSelector({
  selectedYear,
  onYearChange,
  availableYears,
  disabled = false,
  label = "Select Year",
  showMonth = false,
  selectedMonth,
  onMonthChange,
  availableMonths = [],
}: YearSelectorProps) {
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearButtonRef = useRef<HTMLButtonElement>(null);
  const monthButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isYearClick = yearDropdownRef.current?.contains(event.target as Node) || yearButtonRef.current?.contains(event.target as Node);
      const isMonthClick = monthDropdownRef.current?.contains(event.target as Node) || monthButtonRef.current?.contains(event.target as Node);

      if (!isYearClick) setIsYearOpen(false);
      if (!isMonthClick) setIsMonthOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  // Generate years from 2012 to current year only (no future years)
  const allYears = Array.from({ length: currentYear - 2012 + 1 }, (_, i) => 2012 + i);
  const years = Array.from(new Set([...availableYears, ...allYears])).sort((a, b) => b - a);

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    setIsYearOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    onMonthChange?.(month);
    setIsMonthOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Date selection">
      <div className="relative flex-1" role="combobox" aria-expanded={isYearOpen} aria-haspopup="listbox">
        <label htmlFor="year-selector" className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <button
          ref={yearButtonRef}
          type="button"
          id="year-selector"
          onClick={() => !disabled && setIsYearOpen(!isYearOpen)}
          disabled={disabled}
          className={clsx(
            "w-full px-4 py-2.5 rounded-lg border bg-white text-left text-sm text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "flex items-center justify-between gap-2",
            disabled ? "opacity-50 cursor-not-allowed border-gray-200" : "border-gray-300 hover:border-gray-400"
          )}
          aria-label={label}
          aria-controls="year-options"
        >
          <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">{selectedYear}</span>
          <ChevronDown className={clsx("w-5 h-5 text-gray-400 flex-shrink-0 transition-transform", isYearOpen && "rotate-180")} aria-hidden="true" />
        </button>

        {isYearOpen && !disabled && (
          <div
            ref={yearDropdownRef}
            id="year-options"
            role="listbox"
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 animate-slide-down"
            aria-label="Available years"
          >
            <ul role="listbox">
              {years.map((year) => (
                <li key={year} role="option" aria-selected={year === selectedYear}>
                  <button
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={clsx(
                      "w-full px-4 py-2 text-left text-sm transition-colors",
                      year === selectedYear
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50",
                      year === currentYear && "font-bold"
                    )}
                  >
                    {year}
                    {year === currentYear && <span className="ml-2 text-xs text-primary-500">(Current)</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showMonth && (
        <div className="relative flex-1" role="combobox" aria-expanded={isMonthOpen} aria-haspopup="listbox">
          <label htmlFor="month-selector" className="block text-sm font-medium text-gray-700 mb-1.5">
            Month
          </label>
          <button
            ref={monthButtonRef}
            type="button"
            id="month-selector"
            onClick={() => !disabled && setIsMonthOpen(!isMonthOpen)}
            disabled={disabled}
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border bg-white text-left text-sm text-gray-900",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
              "flex items-center justify-between gap-2",
              disabled ? "opacity-50 cursor-not-allowed border-gray-200" : "border-gray-300 hover:border-gray-400"
            )}
            aria-label="Select month"
            aria-controls="month-options"
          >
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">
              {selectedMonth ? MONTHS.find((m) => m.value === selectedMonth)?.label : "Select Month"}
            </span>
            <ChevronDown className={clsx("w-5 h-5 text-gray-400 flex-shrink-0 transition-transform", isMonthOpen && "rotate-180")} aria-hidden="true" />
          </button>

          {isMonthOpen && !disabled && (
            <div
              ref={monthDropdownRef}
              id="month-options"
              role="listbox"
              className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 animate-slide-down"
              aria-label="Available months"
            >
              <ul role="listbox">
                {MONTHS.filter((m) => availableMonths.length === 0 || availableMonths.includes(m.value)).map((month) => (
                  <li key={month.value} role="option" aria-selected={month.value === selectedMonth}>
                    <button
                      type="button"
                      onClick={() => handleMonthSelect(month.value)}
                      className={clsx(
                        "w-full px-4 py-2 text-left text-sm transition-colors",
                        month.value === selectedMonth
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {month.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const currentYear = new Date().getFullYear();
const maxYear = currentYear;

export function YearInput({
  value,
  onChange,
  min = 2012,
  max = maxYear,
  label = "Year",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  label?: string;
  error?: string;
}) {
  return (
    <div className="w-full">
      <label htmlFor="year-input" className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        id="year-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-32"
        placeholder="YYYY"
        aria-invalid={error ? "true" : "false"}
      />
      {error && <p className="mt-1.5 text-sm text-danger-600" role="alert">{error}</p>}
    </div>
  );
}