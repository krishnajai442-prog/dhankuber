"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/home/SiteHeader";
import { LiveResultsTable, LiveRow, LiveSection } from "@/components/home/LiveResultsTable";
import { MonthlyChartTable } from "@/components/home/MonthlyChartTable";
import { FloatingButtons } from "@/components/home/FloatingButtons";
import { Footer } from "@/components/layout/Footer";
import {
  DEFAULT_MARKETS, MAJOR_SLUGS, MONTH_NAMES, MONTH_SHORT, MISSING_MARK, UPCOMING_MARK,
  addDays, autoResult, buildMonthlyRows, dateKey, drawSection, firstEntryDates, fmtTimeLabel,
  fetchChartsResilient, getCachedCharts, getDrawTime, istNow, istToday, longDate, minutesOf,
  ordinal, slugify, titleFromSlug, taglineYears, weekdayOf, DrawSection,
} from "@/lib/markets";

interface ApiChart {
  id: string;
  chartName: string;
  result: string;
  date: number;
  month: number;
  year: number;
  isHighlighted: boolean;
  isActive: boolean;
  drawTime?: string | null;
  displayOrder?: number;
  updatedAt?: string;
}

type RowState = LiveRow & {
  minutes: number;
  passed: boolean;
  dbTime?: string | null;
  dbToday?: string;
  dbYesterday?: string;
  hasDb: boolean;
  dbHighlight: boolean;
  section: DrawSection;
};

function readSelFromUrl(): { month: number; year: number } | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const m = parseInt(p.get("month") || "", 10);
  const y = parseInt(p.get("year") || "", 10);
  if (m >= 1 && m <= 12 && y >= 2012 && y <= 2100) return { month: m, year: y };
  return null;
}

export default function HomePage() {
  /* ------------------------------ live IST clock ---------------------------- */
  const [now, setNow] = useState(() => istNow());
  useEffect(() => {
    const t = setInterval(() => setNow(istNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = istToday(now);
  const yesterday = addDays(today, -1);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minuteKey = Math.floor(now.getTime() / 60000);
  const todayKey = `${today.year}-${today.month}-${today.day}`;
  const yesterdayKey = `${yesterday.year}-${yesterday.month}-${yesterday.day}`;

  /* --------------------- daily + all charts: cache-first + fetch ------------ */
  const [todayCharts, setTodayCharts] = useState<ApiChart[]>([]);
  const [yesterdayCharts, setYesterdayCharts] = useState<ApiChart[]>([]);
  const [allCharts, setAllCharts] = useState<ApiChart[]>([]);
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    const t = getCachedCharts(todayKey);
    if (t.length) setTodayCharts(t as ApiChart[]);
    const y = getCachedCharts(yesterdayKey);
    if (y.length) setYesterdayCharts(y as ApiChart[]);
    const a = getCachedCharts("all-markets");
    if (a.length) setAllCharts(a as ApiChart[]);
    setBooted(true);
  }, [todayKey, yesterdayKey]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [t, y] = await Promise.all([
        fetchChartsResilient(`/api/charts?year=${today.year}&month=${today.month}&date=${today.day}`, todayKey),
        fetchChartsResilient(`/api/charts?year=${yesterday.year}&month=${yesterday.month}&date=${yesterday.day}`, yesterdayKey),
      ]);
      if (!alive) return;
      if (t) setTodayCharts(t as ApiChart[]);
      if (y) setYesterdayCharts(y as ApiChart[]);
    };
    load();
    const ref = setInterval(load, 60000);
    return () => { alive = false; clearInterval(ref); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, yesterdayKey]);

  useEffect(() => {
    let alive = true;
    const loadAll = async () => {
      const d = await fetchChartsResilient(`/api/charts`, "all-markets");
      if (alive && d) setAllCharts(d as ApiChart[]);
    };
    loadAll();
    const ref = setInterval(loadAll, 60000);
    return () => { alive = false; clearInterval(ref); };
  }, []);

  // Generation date per market (earliest entry) — drives the backfill rule.
    const firstEntryBySlug = useMemo(() => firstEntryDates(allCharts), [allCharts]);

   // The 4 tables with the MOST RECENT results become the monthly chart columns,
  // labelled with their FULL market / team names.
  const monthlyColumns = useMemo(() => {
    const nameBySlug = new Map<string, string>();
    for (const name of DEFAULT_MARKETS) nameBySlug.set(slugify(name), name);
    for (const c of allCharts) nameBySlug.set(slugify(c.chartName), c.chartName);
    const fullName = (s: string) => nameBySlug.get(s) ?? titleFromSlug(s);

    const latest = new Map<string, { date: number; updated: number }>();
    for (const c of allCharts) {
      const s = slugify(c.chartName);
      const d = dateKey(c.year, c.month, c.date);
      const u = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
      const prev = latest.get(s);
      if (!prev || d > prev.date || (d === prev.date && u > prev.updated)) {
        latest.set(s, { date: d, updated: u });
      }
    }
    const ranked = Array.from(latest.entries())
      .sort((a, b) => b[1].date - a[1].date || b[1].updated - a[1].updated || a[0].localeCompare(b[0]))
      .slice(0, 4)
      .map(([s]) => ({ key: s, label: fullName(s) }));
    // Always show 4 columns: pad with default markets (full names) when DB has fewer.
    for (const name of DEFAULT_MARKETS) {
      if (ranked.length >= 4) break;
      const s = slugify(name);
      if (!ranked.some((c) => c.key === s)) ranked.push({ key: s, label: name });
    }
    return ranked.slice(0, 4);
  }, [allCharts]);

  /* ------------------------------- daily rows ------------------------------- */
  const sections = useMemo<LiveSection[]>(() => {
    const bySlug = new Map<string, RowState>();
    const ensure = (name: string): RowState => {
      const slug = slugify(name);
      if (!bySlug.has(slug)) {
        bySlug.set(slug, {
          slug, name, timeLabel: "", yesterday: MISSING_MARK, today: UPCOMING_MARK,
          highlighted: false, minutes: 0, passed: false,
          hasDb: false, dbHighlight: false, section: "REST",
        });
      }
      return bySlug.get(slug)!;
    };
    const absorb = (r: RowState, c: ApiChart) => {
      r.hasDb = true;
      if (c.isHighlighted) r.dbHighlight = true;
      r.dbTime = r.dbTime || c.drawTime;
    };

    for (const c of yesterdayCharts) {
      const r = ensure(c.chartName);
      r.dbYesterday = c.result;
      absorb(r, c);
    }
        for (const c of todayCharts) {
      const r = ensure(c.chartName);
      r.dbToday = c.result;
      // TODAY's admin-set draw time ALWAYS wins over yesterday's / older times.
      // Empty ("") means "use the default schedule", so it overrides old times too.
      r.dbTime = c.drawTime || null;
      absorb(r, c);
    }
    for (const m of DEFAULT_MARKETS) ensure(m);

    // Include every existing market (latest entry for name / draw-time / highlight).
    const meta = new Map<string, { name: string; drawTime?: string | null; highlighted: boolean; key: number }>();
    for (const c of allCharts) {
      const s = slugify(c.chartName);
      const k = dateKey(c.year, c.month, c.date);
      const prev = meta.get(s);
      if (!prev || k >= prev.key) meta.set(s, { name: c.chartName, drawTime: c.drawTime, highlighted: c.isHighlighted, key: k });
    }
    for (const mm of Array.from(meta.values())) {
      const r = ensure(mm.name);
      r.dbTime = r.dbTime || mm.drawTime;
      if (!r.hasDb && mm.highlighted) r.highlighted = true;
    }

    const yKey = dateKey(yesterday.year, yesterday.month, yesterday.day);
    const list = Array.from(bySlug.values());
    for (const r of list) {
      if (r.hasDb) r.highlighted = r.dbHighlight;
      const time = getDrawTime(r.slug, r.dbTime);
      r.minutes = minutesOf(time);
      r.timeLabel = fmtTimeLabel(time);
      r.passed = nowMinutes >= r.minutes;
      r.section = drawSection(r.minutes, nowMinutes);

      // TODAY: hidden until the draw time. After → admin value, else "--". NEVER auto.
      r.today = r.passed ? (r.dbToday || MISSING_MARK) : UPCOMING_MARK;
      // YESTERDAY: admin value, else auto ONLY if before the market's generation, else "--".
      const gen = firstEntryBySlug.get(r.slug);
      if (r.dbYesterday) r.yesterday = r.dbYesterday;
      else if (gen !== undefined && yKey < gen) r.yesterday = autoResult(r.slug, yesterday.day, yesterday.month, yesterday.year);
      else r.yesterday = MISSING_MARK;
    }

    const live = list.filter((r) => r.section === "LIVE").sort((a, b) => b.minutes - a.minutes);
    const next = list.filter((r) => r.section === "NEXT").sort((a, b) => a.minutes - b.minutes);
    const rest = list.filter((r) => r.section === "REST").sort((a, b) => a.minutes - b.minutes);
    // LIVE header is ALWAYS shown (with its pulsing icon), even before the first draw.
    return [
      { label: "LIVE", rows: live },
      { label: "NEXT", rows: next },
      { label: "REST", rows: rest },
    ].filter((s) => s.label === "LIVE" || s.rows.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCharts, yesterdayCharts, allCharts, firstEntryBySlug, minuteKey]);

  /* ------------------ monthly chart: month/year live in URL ----------------- */
  const [sel, setSel] = useState<{ month: number; year: number } | null>(null);
  useLayoutEffect(() => {
    const fromUrl = readSelFromUrl();
    const t = istToday(istNow());
    setSel(fromUrl || { month: t.month, year: t.year });
  }, []);

  const [monthCharts, setMonthCharts] = useState<ApiChart[]>([]);
  useEffect(() => {
    if (!sel) return;
    let alive = true;
    const key = `m-${sel.year}-${sel.month}`;
    setMonthCharts(getCachedCharts(key) as ApiChart[]);
    fetchChartsResilient(`/api/charts?year=${sel.year}&month=${sel.month}`, key).then((d) => {
      if (alive && d) setMonthCharts(d as ApiChart[]);
    });
    return () => { alive = false; };
  }, [sel]);

  const monthlyRows = useMemo(
    () => (sel ? buildMonthlyRows(monthlyColumns, sel, monthCharts, today, nowMinutes, firstEntryBySlug) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, monthCharts, monthlyColumns, firstEntryBySlug, minuteKey, today.day]
  );

  const navigateMonth = (m: number, y: number) => {
    window.location.assign(`/?ResultFor=${MONTH_NAMES[m - 1]}-${y}&month=${m}&year=${y}#mix-chart`);
  };

  const selMonth = sel?.month ?? today.month;
  const selYear = sel?.year ?? today.year;
  const prevDate = new Date(selYear, selMonth - 2, 1);
  const nextDate = new Date(selYear, selMonth, 1);
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const tagline = `Daily Superfast Dhan Kuber Result of ${ordinal(today.day)} ${MONTH_NAMES[today.month - 1]} ${today.year} And Leak Numbers for Ghaziabad and Faridabad With Complete Old Dhan Kuber Chart of ${taglineYears().join(", ")} From Dhan Kuber, Dhan Kuber Ghaziabad, Dhan Kuber Faridabad.`;

  return (
    <div className="flex min-h-screen flex-col bg-[#ececec]">
      <SiteHeader tagline={tagline} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16">
        <p suppressHydrationWarning className="mt-4 text-center text-sm text-[#16a34a]">
          Updated: {MONTH_NAMES[now.getMonth()]} {now.getDate()}, {now.getFullYear()}, {clock} IST.
        </p>
        <div className="mt-6 space-y-6">
          <LiveResultsTable
            banner={`Dhan Kuber Results of ${longDate(today)} & ${longDate(yesterday)}`}
            col1={`${weekdayOf(yesterday)}. ${ordinal(yesterday.day)}`}
            col2={`${weekdayOf(today)}. ${ordinal(today.day)}`}
            sections={booted ? sections : []}
            showFooter
          />
          <div className="bg-[#1565d8] px-4 py-3 text-center text-sm text-white sm:text-base">
            <span className="mr-1 font-bold text-[#ff8a80]">New:</span>
            Show your game at its original position of the next day
          </div>
          <div id="mix-chart">
              <MonthlyChartTable
              title={`Monthly Dhan Kuber Result Chart of ${MONTH_NAMES[selMonth - 1]} ${selYear} for Ghaziabad and Faridabad`}
                            columns={monthlyColumns}
              rows={monthlyRows}
              prevLabel={`${MONTH_SHORT[prevDate.getMonth()]} ${prevDate.getFullYear()}`}
              nextLabel={`${MONTH_SHORT[nextDate.getMonth()]} ${nextDate.getFullYear()}`}
              onPrev={() => navigateMonth(prevDate.getMonth() + 1, prevDate.getFullYear())}
              onNext={() => navigateMonth(nextDate.getMonth() + 1, nextDate.getFullYear())}
              latestLabel={`Click here to view the latest chart for ${monthlyColumns.map((c) => c.label).join(", ")} for ${MONTH_NAMES[today.month - 1]}-${today.year}`}
              onLatest={() => navigateMonth(today.month, today.year)}
              selectorLabel={`Select a month and year to view the combined chart for ${monthlyColumns.map((c) => c.label).join(", ")}.`}
              selectedMonth={selMonth}
              selectedYear={selYear}
              onGo={(m, y) => navigateMonth(m, y)}
            />
          </div>
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}