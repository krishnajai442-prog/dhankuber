"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Clock3, Eraser, Zap } from "lucide-react";
import { clsx } from "clsx";
import { fmtTimeLabel, getDrawTime, istNow, slugify } from "@/lib/markets";

interface DrawTimePickerProps {
  /** 24h "HH:MM" string, or "" when unset (default market time applies). */
  value: string;
  onChange: (value: string) => void;
  marketName?: string;
  id?: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");

function parse24(v: string): { h12: number; m: number; period: "AM" | "PM" } | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return null;
  const [H, M] = v.split(":").map(Number);
  return { h12: H % 12 === 0 ? 12 : H % 12, m: M, period: H >= 12 ? "PM" : "AM" };
}

function to24(h12: number, m: number, period: "AM" | "PM"): string {
  let H = h12 % 12;
  if (period === "PM") H += 12;
  return `${pad(H)}:${pad(m)}`;
}

const PRESETS = [
  { name: "Gali", slug: "gali" },
  { name: "Desawar", slug: "desawar" },
  { name: "Faridabad", slug: "faridabad" },
  { name: "Haruf King", slug: "haruf-king" },
  { name: "Ghaziabad", slug: "ghaziabad" },
];

export function DrawTimePicker({ value, onChange, marketName, id = "drawTime" }: DrawTimePickerProps) {
  const initial = parse24(value);
  const [h, setH] = useState(initial ? pad(initial.h12) : "");
  const [m, setM] = useState(initial ? pad(initial.m) : "");
  const [period, setPeriod] = useState<"AM" | "PM">(initial?.period ?? "AM");
  const lastEmitted = useRef<string | null>(null);

  // Sync drafts only when the value changes from OUTSIDE (edit-page load, reset…)
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const p = parse24(value);
    if (p) {
      setH(pad(p.h12));
      setM(pad(p.m));
      setPeriod(p.period);
    } else {
      setH("");
      setM("");
    }
    lastEmitted.current = value;
  }, [value]);

  const emit = (hh: string, mm: string, p: "AM" | "PM") => {
    if (hh.trim() === "" || mm.trim() === "") {
      lastEmitted.current = "";
      onChange("");
      return;
    }
    const h12 = Math.min(12, Math.max(1, parseInt(hh, 10) || 12));
    const mm2 = Math.min(59, Math.max(0, parseInt(mm, 10) || 0));
    const v = to24(h12, mm2, p);
    lastEmitted.current = v;
    onChange(v);
  };

  const onHourInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2); // backspace-friendly
    setH(digits);
    emit(digits, m, period);
  };
  const onMinuteInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setM(digits);
    emit(h, digits, period);
  };

  const commitHour = () => {
    let hh = h;
    if (hh === "" && m !== "") hh = "12";
    if (hh !== "") hh = pad(Math.min(12, Math.max(1, parseInt(hh, 10) || 12)));
    let mm = m;
    if (mm === "" && hh !== "") mm = "00";
    setH(hh);
    setM(mm);
    emit(hh, mm, period);
  };
  const commitMinute = () => {
    let mm = m;
    if (mm === "" && h !== "") mm = "00";
    if (mm !== "") mm = pad(Math.min(59, Math.max(0, parseInt(mm, 10) || 0)));
    let hh = h;
    if (hh === "" && mm !== "") hh = "12";
    setM(mm);
    setH(hh);
    emit(hh, mm, period);
  };

  const step = (field: "h" | "m", dir: 1 | -1) => {
    let hh = h === "" ? "12" : h;
    let mm = m === "" ? "00" : m;
    if (field === "h") {
      let n = (parseInt(hh, 10) || 12) + dir;
      if (n > 12) n = 1;
      if (n < 1) n = 12;
      hh = pad(n);
    } else {
      let n = (parseInt(mm, 10) || 0) + dir;
      if (n > 59) n = 0;
      if (n < 0) n = 59;
      mm = pad(n);
    }
    setH(hh);
    setM(mm);
    emit(hh, mm, period);
  };

  const onKey = (field: "h" | "m") => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      step(field, 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      step(field, -1);
    }
  };

  const choosePeriod = (p: "AM" | "PM") => {
    setPeriod(p);
    emit(h, m, p);
  };

  const apply = (v: string) => {
    const p = parse24(v);
    if (!p) return;
    setH(pad(p.h12));
    setM(pad(p.m));
    setPeriod(p.period);
    lastEmitted.current = v;
    onChange(v);
  };

  const useNow = () => {
    const d = istNow();
    apply(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };
  const clear = () => {
    setH("");
    setM("");
    lastEmitted.current = "";
    onChange("");
  };

  const hasValue = Boolean(parse24(value));
  const effective = hasValue ? value : getDrawTime(slugify(marketName || ""), null);
  const publicLabel = fmtTimeLabel(effective);
  const majorDefault = PRESETS.find((p) => p.slug === slugify(marketName || ""));

  const fieldCls =
    "w-16 rounded-lg border border-gray-300 bg-white px-2 py-2 text-center font-mono text-2xl font-bold text-gray-900 caret-blue-600 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const stepBtn =
    "flex h-5 w-8 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition";

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Clock3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Draw Time
        </span>
        <span className="badge badge-primary">12-hour · AM / PM</span>
      </div>

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Draw time">
        {/* HOUR */}
        <div className="flex items-center gap-1">
          <input
            id={`${id}-hour`}
            aria-label="Hour (1 to 12)"
            inputMode="numeric"
            autoComplete="off"
            placeholder="--"
            value={h}
            onChange={(e) => onHourInput(e.target.value)}
            onBlur={commitHour}
            onKeyDown={onKey("h")}
            className={fieldCls}
          />
          <span className="flex flex-col">
            <button type="button" className={stepBtn} aria-label="Increase hour" onClick={() => step("h", 1)}>
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" className={stepBtn} aria-label="Decrease hour" onClick={() => step("h", -1)}>
              <ChevronDown className="h-4 w-4" />
            </button>
          </span>
        </div>

        <span className="pb-1 font-mono text-2xl font-bold text-gray-400" aria-hidden="true">:</span>

        {/* MINUTE */}
        <div className="flex items-center gap-1">
          <input
            id={`${id}-minute`}
            aria-label="Minute (0 to 59)"
            inputMode="numeric"
            autoComplete="off"
            placeholder="--"
            value={m}
            onChange={(e) => onMinuteInput(e.target.value)}
            onBlur={commitMinute}
            onKeyDown={onKey("m")}
            className={fieldCls}
          />
          <span className="flex flex-col">
            <button type="button" className={stepBtn} aria-label="Increase minute" onClick={() => step("m", 1)}>
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" className={stepBtn} aria-label="Decrease minute" onClick={() => step("m", -1)}>
              <ChevronDown className="h-4 w-4" />
            </button>
          </span>
        </div>

        {/* AM / PM */}
        <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white" role="group" aria-label="AM or PM">
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => choosePeriod(p)}
              className={clsx(
                "px-4 py-2.5 text-sm font-bold transition-colors",
                period === p
                  ? p === "AM"
                    ? "bg-amber-400 text-gray-900"
                    : "bg-indigo-600 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={useNow}
            className="btn btn-outline h-9 px-3 text-xs"
            title="Set to current IST time"
          >
            <Zap className="mr-1 h-3.5 w-3.5 text-amber-500" />
            Now (IST)
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!hasValue && h === "" && m === ""}
            className="btn btn-ghost h-9 px-3 text-xs text-gray-500"
            title="Clear — use the default market time"
          >
            <Eraser className="mr-1 h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Quick presets */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Quick set:</span>
        {PRESETS.map((p) => {
          const t = getDrawTime(p.slug, null);
          const active = hasValue && value === t;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => apply(t)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all active:scale-95",
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow"
                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700"
              )}
            >
              {p.name} · {fmtTimeLabel(t)}
            </button>
          );
        })}
      </div>

      {/* Live reflection of exactly what visitors see */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2">
        <span className="font-mono text-xl font-bold tracking-wide text-gray-900">
          {hasValue ? fmtTimeLabel(value) : "--:-- --"}
        </span>
        <span className="text-xs text-gray-600">
          {hasValue ? (
            <>
              Visitors will see:{" "}
              <span className="font-semibold text-blue-700">at {publicLabel}</span>
            </>
          ) : majorDefault ? (
            <>
              Unset — default for {majorDefault.name} applies:{" "}
              <span className="font-semibold text-blue-700">at {publicLabel}</span>
            </>
          ) : (
            <>
              Unset — fallback applies:{" "}
              <span className="font-semibold text-blue-700">at {publicLabel}</span>
            </>
          )}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Type digits, edit with <kbd className="rounded border border-gray-300 bg-white px-1 font-mono">Backspace</kbd>, use{" "}
        <kbd className="rounded border border-gray-300 bg-white px-1 font-mono">↑</kbd>/
        <kbd className="rounded border border-gray-300 bg-white px-1 font-mono">↓</kbd> or the arrows, then pick AM / PM.
        Leave empty to use the default market time.
      </p>
    </div>
  );
}