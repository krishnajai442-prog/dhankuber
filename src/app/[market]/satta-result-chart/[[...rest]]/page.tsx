"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/home/SiteHeader";
import { LiveResultsTable, LiveRow } from "@/components/home/LiveResultsTable";
import { MonthlyChartTable } from "@/components/home/MonthlyChartTable";
import { FloatingButtons } from "@/components/home/FloatingButtons";
import { Footer } from "@/components/layout/Footer";
import {
  MISSING_MARK, UPCOMING_MARK, MONTH_NAMES, MONTH_SHORT, addDays, autoResult,
  buildMonthlyRows, dateKey, firstEntryDates, fetchChartsResilient, getCachedCharts,
  fmtTimeLabel, getDrawTime, istNow, istToday, longDate, minutesOf, ordinal, slugify,
  titleFromSlug, weekdayOf,
} from "@/lib/markets";

/* ---------------------------------- types --------------------------------- */

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
}

type RowState = LiveRow & {
  minutes: number;
  passed: boolean;
  dbTime?: string | null;
  dbToday?: string;
  dbYesterday?: string;
};

/* --------------------------------- helpers -------------------------------- */

/** Read ?month=&year= from the address bar (same idea as chart.php?month=11&year=2026). */
function readSelFromUrl(): { month: number; year: number } | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const m = parseInt(p.get("month") || "", 10);
  const y = parseInt(p.get("year") || "", 10);
  if (m >= 1 && m <= 12 && y >= 2012 && y <= 2100) return { month: m, year: y };
  return null;
}

/* ---------------------------------- page ---------------------------------- */

export default function MarketChartPage() {
  const params = useParams();
  const slug = (params.market as string) || "";
  const canonical = titleFromSlug(slug);

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

  // Inject localStorage cache BEFORE first paint so rows never flash/disappear.
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

  // Every market in the DB → used to compute each market's generation date.
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

  const firstEntryBySlug = useMemo(() => firstEntryDates(allCharts), [allCharts]);

    /* ------------------------- the market table ----------------------- */
  const smallSlugs = useMemo(() => {
  const list = [slug, "faridabad", "ghaziabad"];
  return Array.from(new Set(list.filter(Boolean)));
}, [slug]);

  const rows = useMemo(() => {
    const bySlug = new Map<string, RowState>();
    const ensure = (name: string): RowState => {
      const s = slugify(name);
      if (!bySlug.has(s)) {
        bySlug.set(s, {
          slug: s, name, timeLabel: "", yesterday: MISSING_MARK, today: UPCOMING_MARK,
          highlighted: false, minutes: 0, passed: false,
        });
      }
      return bySlug.get(s)!;
    };

    for (const c of yesterdayCharts) {
      if (!smallSlugs.includes(slugify(c.chartName))) continue;
      const r = ensure(c.chartName);
      r.dbYesterday = c.result;
      r.dbTime = r.dbTime || c.drawTime;
      if (c.isHighlighted) r.highlighted = true;
    }
    for (const c of todayCharts) {
      if (!smallSlugs.includes(slugify(c.chartName))) continue;
      const r = ensure(c.chartName);
      r.dbToday = c.result;
      r.dbTime = c.drawTime || null; // today's admin time wins
      if (c.isHighlighted) r.highlighted = true;
    }
    for (const s of smallSlugs) ensure(s === slug ? canonical : titleFromSlug(s));

    const yKey = dateKey(yesterday.year, yesterday.month, yesterday.day);
    const out: RowState[] = [];
    for (const s of smallSlugs) {
      const r = bySlug.get(s);
      if (!r) continue;
      const time = getDrawTime(r.slug, r.dbTime);
      r.minutes = minutesOf(time);
      r.timeLabel = fmtTimeLabel(time);
      r.passed = nowMinutes >= r.minutes;
      // TODAY: admin value, else "--" once passed, else "XX" (upcoming). Never auto.
      r.today = r.dbToday ? r.dbToday : r.passed ? MISSING_MARK : UPCOMING_MARK;
      // YESTERDAY: admin value, else auto ONLY if before generation, else "--".
      const gen = firstEntryBySlug.get(r.slug);
      if (r.dbYesterday) r.yesterday = r.dbYesterday;
      else if (gen !== undefined && yKey < gen) r.yesterday = autoResult(r.slug, yesterday.day, yesterday.month, yesterday.year);
      else r.yesterday = MISSING_MARK;
      out.push(r);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCharts, yesterdayCharts, firstEntryBySlug, minuteKey, smallSlugs]);

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
    setMonthCharts(getCachedCharts(key) as ApiChart[]); // instant from cache
    fetchChartsResilient(`/api/charts?year=${sel.year}&month=${sel.month}`, key).then((d) => {
      if (alive && d) setMonthCharts(d as ApiChart[]);
    });
    return () => { alive = false; };
  }, [sel]);

    const monthlyColumns = useMemo(() => {
    const nameBySlug = new Map<string, string>();
    for (const c of allCharts) nameBySlug.set(slugify(c.chartName), c.chartName);
    const extra = ["faridabad", "ghaziabad"].map((s) => ({
      key: s,
      label: nameBySlug.get(s) ?? titleFromSlug(s),
    }));
    return [{ key: slug, label: canonical }, ...extra];
  }, [slug, canonical, allCharts]);

  const monthlyRows = useMemo(
    () => (sel ? buildMonthlyRows(monthlyColumns, sel, monthCharts, today, nowMinutes, firstEntryBySlug) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, monthCharts, firstEntryBySlug, minuteKey, monthlyColumns, today.day]
  );

  /** Full page navigation (reload) to the requested month — same as the reference site. */
  const navigateMonth = (m: number, y: number) => {
    window.location.assign(
      `/${slug}/satta-result-chart/?ResultFor=${MONTH_NAMES[m - 1]}-${y}&month=${m}&year=${y}#mix-chart`
    );
  };

  const selMonth = sel?.month ?? today.month;
  const selYear = sel?.year ?? today.year;
  const prevDate = new Date(selYear, selMonth - 2, 1);
  const nextDate = new Date(selYear, selMonth, 1);

  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const tagline = `${canonical} Satta Result And Monthly Satta Chart of ${MONTH_NAMES[today.month - 1]} ${today.year} With Combined Chart of Ghaziabad And Faridabad From Dhan Kuber, Dhan Kuber Result, Dhan Kuber Chart, Black Dhan Kuber and Dhan Kuber 786.`;

  /* --------------------------------- render -------------------------------- */
  return (
    <div className="flex min-h-screen flex-col bg-[#ececec]">
      <SiteHeader tagline={tagline} />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16">
        <p suppressHydrationWarning className="mt-4 text-center text-sm text-[#16a34a]">
          Updated: {MONTH_NAMES[now.getMonth()]} {now.getDate()}, {now.getFullYear()}, {clock} IST.
        </p>

        <div className="mt-6 space-y-6">
          <LiveResultsTable
            banner={`${canonical} Satta Result of ${longDate(today)} & ${longDate(yesterday)}`}
            col1={`${weekdayOf(yesterday)}. ${ordinal(yesterday.day)}`}
            col2={`${weekdayOf(today)}. ${ordinal(today.day)}`}
            rows={booted ? rows : []}
            showLive={false}
          />

          <Link
            href="/"
            className="block bg-[#3d3d3d] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[#333] sm:text-base"
          >
            Click here for all Regional Offline Draw Results.
          </Link>

          <div className="bg-[#1565d8] px-4 py-3 text-center text-sm text-white sm:text-base">
            <span className="mr-1 font-bold text-[#ff8a80]">New:</span>
            Show your game at its original position of the next day
          </div>

          <div id="mix-chart">
              <MonthlyChartTable
              title={`${canonical} Satta Result Chart of ${MONTH_NAMES[selMonth - 1]} ${selYear} with Ghaziabad and Faridabad`}
              columns={monthlyColumns}
              rows={monthlyRows}
              prevLabel={`${MONTH_SHORT[prevDate.getMonth()]} ${prevDate.getFullYear()}`}
              nextLabel={`${MONTH_SHORT[nextDate.getMonth()]} ${nextDate.getFullYear()}`}
              onPrev={() => navigateMonth(prevDate.getMonth() + 1, prevDate.getFullYear())}
              onNext={() => navigateMonth(nextDate.getMonth() + 1, nextDate.getFullYear())}
              latestLabel={`Click here to view the latest chart for Ghaziabad and Faridabad for ${MONTH_NAMES[today.month - 1]}-${today.year}`}
              onLatest={() => navigateMonth(today.month, today.year)}
              selectorLabel={`Select a month and year to view the combined chart for ${canonical}, Ghaziabad and Faridabad.`}
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