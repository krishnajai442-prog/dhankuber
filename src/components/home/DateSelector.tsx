"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

interface DateSelectorProps {
  selectedDate: number;
  onDateChange: (date: number) => void;
  availableDates: number[];
  month: number;
  year: number;
  disabled?: boolean;
  label?: string;
}

export function DateSelector({
  selectedDate,
  onDateChange,
  availableDates,
  month,
  year,
  disabled = false,
  label = "Select Date",
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selectedDate.toString().padStart(2, "0"));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: number) => {
    const formatted = date.toString().padStart(2, "0");
    setInputValue(formatted);
    onDateChange(date);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDate = today.getDate();

  return (
    <div className="relative" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <label htmlFor={`date-selector-${month}-${year}`} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={`date-selector-${month}-${year}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            "w-full px-4 py-2.5 rounded-lg border bg-white text-left text-sm text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "flex items-center justify-between gap-2",
            disabled ? "opacity-50 cursor-not-allowed border-gray-200" : "border-gray-300 hover:border-gray-400"
          )}
          aria-label={label}
          aria-controls={`date-options-${month}-${year}`}
        >
          <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">
            {inputValue || "DD"}
          </span>
          <ChevronDown className={clsx("w-5 h-5 text-gray-400 flex-shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
        </button>

        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            id={`date-options-${month}-${year}`}
            role="listbox"
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 animate-slide-down"
            aria-label="Available dates"
          >
            {availableDates.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-gray-500">
                No dates available for this month
              </div>
            ) : (
              <ul role="listbox">
                {availableDates.map((date) => (
                  <li key={date} role="option" aria-selected={date === selectedDate}>
                    <button
                      type="button"
                      onClick={() => handleSelect(date)}
                      className={clsx(
                        "w-full px-4 py-2 text-left text-sm transition-colors",
                        date === selectedDate
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50",
                        isCurrentMonth && date === todayDate && "font-bold text-primary-600"
                      )}
                    >
                      {date.toString().padStart(2, "0")}
                      {isCurrentMonth && date === todayDate && (
                        <span className="ml-2 text-xs text-primary-500">(Today)</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DateInput({
  value,
  onChange,
  min = 1,
  max = 31,
  label = "Date",
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
      <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        id="date-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-24"
        placeholder="DD"
        aria-invalid={error ? "true" : "false"}
      />
      {error && <p className="mt-1.5 text-sm text-danger-600" role="alert">{error}</p>}
    </div>
  );
}