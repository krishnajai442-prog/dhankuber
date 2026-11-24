"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/shared/Button";
import { Select } from "@/components/shared/Select";
import { DrawTimePicker } from "@/components/admin/DrawTimePicker";
import { Tag, Hash, CalendarClock, Eye, Star, CalendarDays } from "lucide-react";
import { fmtTimeLabel, getDrawTime, slugify } from "@/lib/markets";
import { SPECIAL_MARKETS, marketKey } from "@/lib/markets";

interface ChartFormData {
  chartName: string;
  result: string;
  date: number;
  month: number;
  year: number;
  displayOrder: number;
  isHighlighted: boolean;
  isActive: boolean;
  scheduledAt?: string; // ISO datetime string
  drawTime?: string; // 24h "HH:MM"
}

interface ChartFormProps {
  initialData?: Partial<ChartFormData>;
  onSubmit: (data: ChartFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  availableYears?: number[];
  availableMonths?: number[];
  availableDates?: number[];
}

const DEFAULT_DATA: ChartFormData = {
  chartName: "",
  result: "",
  date: new Date().getDate(),
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  displayOrder: 0,
  isHighlighted: false,
  isActive: true,
  scheduledAt: "",
  drawTime: "",
};

function buildInitial(initial?: Partial<ChartFormData>): ChartFormData {
  if (!initial) return { ...DEFAULT_DATA };
  return {
    chartName: initial.chartName ?? DEFAULT_DATA.chartName,
    result: initial.result ?? DEFAULT_DATA.result,
    date: initial.date ?? DEFAULT_DATA.date,
    month: initial.month ?? DEFAULT_DATA.month,
    year: initial.year ?? DEFAULT_DATA.year,
    displayOrder: initial.displayOrder ?? DEFAULT_DATA.displayOrder,
    isHighlighted: initial.isHighlighted ?? DEFAULT_DATA.isHighlighted,
    isActive: initial.isActive ?? DEFAULT_DATA.isActive,
    scheduledAt: initial.scheduledAt ?? DEFAULT_DATA.scheduledAt,
    drawTime: initial.drawTime ?? DEFAULT_DATA.drawTime,
  };
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const COMMON_CHARTS = [
   "Faridabad", "Ghaziabad", "Delhi", "Mumbai", "Kolkata", "Chennai",
  "Bangalore", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
  "Indore", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ludhiana", "Agra", "Nashik",
  "Meerut", "Rajkot", "Kalyan", "Vasai", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
  "Amritsar", "Navi Mumbai", "Allahabad", "Howrah", "Gwalior", "Jabalpur", "Coimbatore",
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur",
  "Hubli", "Mysore", "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur", "Moradabad",
  "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Guntur", "Bhiwandi", "Saharanpur",
  "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack",
  "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol",
  "Rourkela", "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain",
  "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", "Sangli", "Mangalore", "Erode",
  "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala",
];

const pad = (n: number) => n.toString().padStart(2, "0");

export function ChartForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  availableYears = [],
  availableMonths = [],
  availableDates = [],
}: ChartFormProps) {
  const [formData, setFormData] = useState<ChartFormData>(() => buildInitial(initialData));
  const [errors, setErrors] = useState<Partial<Record<keyof ChartFormData, string>>>({});

  useEffect(() => {
    setFormData(buildInitial(initialData));
    setErrors({});
  }, [initialData]);

  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validateField = (name: keyof ChartFormData, value: string | number | boolean): string | undefined => {
    switch (name) {
      case "chartName":
        if (!value || (value as string).trim().length === 0) return "Chart name is required";
        if ((value as string).length > 100) return "Chart name too long";
        break;
        case "result":
        // Blank is valid: saves a "pending" table; the number can be added later.
        if ((value as string).length > 20) return "Result too long";
        break;
            case "date": {
        if (typeof value === "number" && formData.month && formData.year) {
          const selectedDate = new Date(formData.year, formData.month - 1, value);
          if (selectedDate > today) return "Future dates not allowed";
          const isSpecial = SPECIAL_MARKETS.some((n) => marketKey(n) === marketKey(formData.chartName || ""));
          if (selectedDate < today && !isSpecial)
            return "Past dates can only be added for Gali, Desawar, Faridabad, Ghaziabad";
        }
        if (typeof value === "number" && (value < 1 || value > 31)) return "Invalid date";
        break;
      }
      case "month":
        if (typeof value === "number" && (value < 1 || value > 12)) return "Invalid month";
        break;
      case "year":
        if (typeof value === "number" && (value < 2012 || value > currentYear))
          return `Invalid year (must be 2012-${currentYear})`;
        break;
      case "scheduledAt":
        if (value && typeof value === "string") {
          const scheduled = new Date(value);
          if (isNaN(scheduled.getTime())) return "Invalid date time format";
          if (scheduled < new Date()) return "Scheduled time cannot be in the past";
        }
        break;
      case "drawTime":
        if (value && typeof value === "string" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
          return "Invalid time (HH:MM)";
        break;
    }
    return undefined;
  };

  const handleChange = (name: keyof ChartFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof ChartFormData, string>> = {};
    let hasErrors = false;
    (Object.keys(formData) as Array<keyof ChartFormData>).forEach((key) => {
      const value = formData[key];
      if (value !== undefined) {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
          hasErrors = true;
        }
      }
    });
    setErrors(newErrors);
    if (hasErrors) return;
    await onSubmit(formData);
  };

  const allYears = Array.from({ length: currentYear - 2012 + 1 }, (_, i) => 2012 + i);
  const years = Array.from(new Set([...availableYears, ...allYears])).sort((a, b) => b - a);
  const months = availableMonths.length > 0 ? availableMonths : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const dates = availableDates.length > 0 ? availableDates : Array.from({ length: 31 }, (_, i) => i + 1);

  const previewTime = formData.drawTime
    ? fmtTimeLabel(formData.drawTime)
    : fmtTimeLabel(getDrawTime(slugify(formData.chartName || ""), null));

  const sectionTitle = "mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* LIVE PUBLIC PREVIEW — exactly the row visitors will see */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="bg-[#3ed99c] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">
          LIVE PREVIEW — HOW VISITORS WILL SEE THIS ENTRY
        </div>
        <div
          className={clsx(
            "flex items-center justify-between gap-4 px-4 py-3 transition-colors",
            formData.isHighlighted ? "bg-[#f2c900]" : "bg-white"
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-lg font-medium uppercase text-gray-900">
              {formData.chartName || "Market Name"}
            </p>
             <p className="mt-0.5 text-xs text-gray-700">
              at {previewTime}
              <span className="ml-2 text-sm text-blue-600">Record Chart</span>
              {!formData.result.trim() && (
                <span className="badge badge-warning ml-2">Result pending</span>
              )}
            </p>
          </div>
          <div className="font-mono text-3xl font-bold text-gray-900">{formData.result || "--"}</div>
        </div>
        <div className="flex items-center justify-between bg-[#3d3d3d] px-4 py-1.5 text-[11px] text-white">
          <span>
            {pad(formData.date)}/{pad(formData.month)}/{formData.year}
          </span>
          <span className={formData.isActive ? "text-green-300" : "text-red-300"}>
            {formData.isActive ? "Visible to visitors" : "Hidden (inactive)"}
          </span>
        </div>
      </div>

      {/* IDENTITY + RESULT */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className={sectionTitle}>
          <Tag className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Market &amp; Result
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="chartName" className="label">
              Chart / Market Name <span className="text-danger-500">*</span>
            </label>
            <datalist id="chart-names">
              {COMMON_CHARTS.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <input
              type="text"
              id="chartName"
              list="chart-names"
              value={formData.chartName}
              onChange={(e) => handleChange("chartName", e.target.value)}
              className={clsx(
                "input",
                errors.chartName && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
              )}
              placeholder="e.g., Gali, Desawar, Faridabad"
              autoComplete="off"
              required
            />
            {errors.chartName && (
              <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.chartName}</p>
            )}
          </div>

                   <div>
            <label htmlFor="result" className="label">
              Result <span className="text-xs font-normal text-gray-500">(optional now)</span>
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                id="result"
                value={formData.result}
                onChange={(e) => handleChange("result", e.target.value)}
                className={clsx(
                  "input pl-9 font-mono text-lg",
                  errors.result && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                )}
                placeholder="Leave blank to pre-create · e.g., 45"
                maxLength={20}
              />
            </div>
            {errors.result ? (
              <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.result}</p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Save with a blank result to schedule the table now, then add the number 2–5 minutes before its draw time.
              </p>
            )}
          </div>
         
          <div>
            <label htmlFor="displayOrder" className="label">Display Order</label>
            <input
              type="number"
              id="displayOrder"
              value={formData.displayOrder}
              onChange={(e) => handleChange("displayOrder", parseInt(e.target.value) || 0)}
              className="input w-32"
              min={0}
              placeholder="0"
            />
            <p className="mt-1.5 text-xs text-gray-500">Higher than 0 pins this market's position on the public table.</p>
          </div>
        </div>
      </section>

      {/* DATE */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className={sectionTitle}>
          <CalendarDays className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Result Date
        </h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className="label">
              Date <span className="text-danger-500">*</span>
            </label>
            <Select
              id="date"
              value={formData.date}
              onChange={(e) => handleChange("date", parseInt(e.target.value))}
              options={dates.map((d) => ({ value: d, label: pad(d) }))}
              placeholder="Select date"
              error={errors.date}
            />
          </div>
          <div>
            <label htmlFor="month" className="label">
              Month <span className="text-danger-500">*</span>
            </label>
            <Select
              id="month"
              value={formData.month}
              onChange={(e) => handleChange("month", parseInt(e.target.value))}
              options={months.map((mo) => ({
                value: mo,
                label: MONTHS.find((x) => x.value === mo)?.label || mo.toString(),
              }))}
              placeholder="Select month"
              error={errors.month}
            />
          </div>
          <div>
            <label htmlFor="year" className="label">
              Year <span className="text-danger-500">*</span>
            </label>
            <Select
              id="year"
              value={formData.year}
              onChange={(e) => handleChange("year", parseInt(e.target.value))}
              options={years.map((y) => ({ value: y, label: y.toString() }))}
              placeholder="Select year"
              error={errors.year}
            />
          </div>
        </div>
      </section>

      {/* DRAW TIME — 12h editable picker with AM/PM */}
      <section>
        <DrawTimePicker
          id="drawTime"
          value={formData.drawTime || ""}
          marketName={formData.chartName}
          onChange={(v) => handleChange("drawTime", v)}
        />
        {errors.drawTime && (
          <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.drawTime}</p>
        )}
      </section>

      {/* VISIBILITY */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className={sectionTitle}>
          <Eye className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Visibility
        </h3>
        <div className="flex flex-wrap items-center gap-6 rounded-lg bg-gray-50 p-4">
          <label className="flex cursor-pointer select-none items-center gap-3">
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.isHighlighted}
                onChange={(e) => handleChange("isHighlighted", e.target.checked)}
              />
              <span className="block h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-amber-400 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/40" />
              <span className="absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Highlight this result
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-center gap-3">
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              <span className="block h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40" />
              <span className="absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
            <span className="text-sm font-medium text-gray-700">Active / Visible</span>
          </label>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className={sectionTitle}>
          <CalendarClock className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Schedule Publish Time (Optional)
        </h3>
        <input
          type="datetime-local"
          id="scheduledAt"
          value={formData.scheduledAt ? formData.scheduledAt.slice(0, 16) : ""}
          onChange={(e) =>
            handleChange("scheduledAt", e.target.value ? new Date(e.target.value).toISOString() : "")
          }
          className={clsx(
            "input",
            errors.scheduledAt && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
          )}
          min={new Date().toISOString().slice(0, 16)}
        />
        {errors.scheduledAt && (
          <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.scheduledAt}</p>
        )}
        <p className="mt-1.5 text-sm text-gray-500">
          Leave empty to publish immediately. Result will be visible only after this time.
        </p>
      </section>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData?.chartName ? "Update Chart" : "Add Chart"}
        </Button>
      </div>
    </form>
  );
}