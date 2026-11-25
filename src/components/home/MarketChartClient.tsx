"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";
import { LiveResultsTable, LiveRow, LiveSection } from "@/components/home/LiveResultsTable";
import { MonthlyChartTable } from "@/components/home/MonthlyChartTable";
import { FloatingButtons } from "@/components/home/FloatingButtons";
import { Footer } from "@/components/layout/Footer";
import {
  DEFAULT_MARKETS, MISSING_MARK, UPCOMING_MARK, MONTH_NAMES, MONTH_SHORT, addDays, autoResult,
  buildMonthlyRows, dateKey, drawSection, firstEntryDates, fetchChartsResilient, getCachedCharts,
  fmtTimeLabel, getDrawTime, istNow, istToday, longDate, minutesOf, ordinal, slugify,
  titleFromSlug, weekdayOf, DrawSection,
  MIN_YEAR,
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
  hasDb: boolean;
  dbHighlight: boolean;
  section: DrawSection;
};

/** The 4 permanent companion tables (local — no extra markets.ts export needed). */
const SPECIAL_SLUGS = ["desawar", "faridabad", "ghaziabad", "gali"];

/* --------------------------------- helpers -------------------------------- */

function readSelFromUrl(): { month: number; year: number } | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const m = parseInt(p.get("month") || "", 10);
  const y = parseInt(p.get("year") || "", 10);
  if (m >= 1 && m <= 12 && y >= MIN_YEAR && y <= 2100) return { month: m, year: y };
  return null;
}

/* -------------------------------- component ------------------------------- */

export function MarketChartClient({ slug }: { slug: string }) {
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

  const firstEntryBySlug = useMemo(() => firstEntryDates(allCharts), [allCharts]);

  /* --------- extra entry: the market that declared its result most recently -- */
  const recentSlug = useMemo<string | null>(() => {
    const exclude = new Set([slug, ...SPECIAL_SLUGS]);
    let bestSlug: string | null = null;
    let bestRank = -1;
    const consider = (c: ApiChart, dayOffset: number) => {
      const s = slugify(c.chartName);
      if (exclude.has(s)) return;
      if (!c.result || !c.result.trim()) return;
      const mins = minutesOf(getDrawTime(s, c.drawTime));
      if (dayOffset === 1 && nowMinutes < mins) return; // today: only already-declared
      const rank = dayOffset * 1440 + mins;
      if (rank > bestRank) { bestRank = rank; bestSlug = s; }
    };
    for (const c of todayCharts) consider(c, 1);
    for (const c of yesterdayCharts) consider(c, 0);
    return bestSlug;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCharts, yesterdayCharts, slug, minuteKey]);

  /* ------------------- the companion table (6 rows) ------------------------- */
  const smallSlugs = useMemo(() => {
    const list = [slug, ...SPECIAL_SLUGS, ...(recentSlug ? [recentSlug] : [])];
    return Array.from(new Set(list.filter(Boolean)));
  }, [slug, recentSlug]);

  const rows = useMemo(() => {
    const bySlug = new Map<string, RowState>();
    const ensure = (name: string): RowState => {
      const s = slugify(name);
      if (!bySlug.has(s)) {
        bySlug.set(s, {
          slug: s, name, timeLabel: "", yesterday: MISSING_MARK, today: UPCOMING_MARK,
          highlighted: false, minutes: 0, passed: false, hasDb: false, dbHighlight: false, section: "REST",
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
      r.today = r.dbToday ? r.dbToday : r.passed ? MISSING_MARK : UPCOMING_MARK;
      const gen = firstEntryBySlug.get(r.slug);
      if (r.dbYesterday) r.yesterday = r.dbYesterday;
      else if (gen !== undefined && yKey < gen) r.yesterday = autoResult(r.slug, yesterday.day, yesterday.month, yesterday.year);
      else r.yesterday = MISSING_MARK;
      out.push(r);
    }
    out.sort((a, b) => a.minutes - b.minutes); // chronological, like the reference
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCharts, yesterdayCharts, firstEntryBySlug, minuteKey, smallSlugs]);

  /* ------------- the FULL daily table (all markets) shown below ------------- */
  const sections = useMemo<LiveSection[]>(() => {
    const bySlug = new Map<string, RowState>();
    const ensure = (name: string): RowState => {
      const s = slugify(name);
      if (!bySlug.has(s)) {
        bySlug.set(s, {
          slug: s, name, timeLabel: "", yesterday: MISSING_MARK, today: UPCOMING_MARK,
          highlighted: false, minutes: 0, passed: false, hasDb: false, dbHighlight: false, section: "REST",
        });
      }
      return bySlug.get(s)!;
    };
    const absorb = (r: RowState, c: ApiChart) => {
      r.hasDb = true;
      if (c.isHighlighted) r.dbHighlight = true;
      r.dbTime = r.dbTime || c.drawTime;
    };

    for (const c of yesterdayCharts) { const r = ensure(c.chartName); r.dbYesterday = c.result; absorb(r, c); }
    for (const c of todayCharts) { const r = ensure(c.chartName); r.dbToday = c.result; r.dbTime = c.drawTime || null; absorb(r, c); }
    for (const m of DEFAULT_MARKETS) ensure(m);

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
      r.today = r.passed ? (r.dbToday || MISSING_MARK) : UPCOMING_MARK;
      const gen = firstEntryBySlug.get(r.slug);
      if (r.dbYesterday) r.yesterday = r.dbYesterday;
      else if (gen !== undefined && yKey < gen) r.yesterday = autoResult(r.slug, yesterday.day, yesterday.month, yesterday.year);
      else r.yesterday = MISSING_MARK;
    }

    const live = list.filter((r) => r.section === "LIVE").sort((a, b) => b.minutes - a.minutes);
    const next = list.filter((r) => r.section === "NEXT").sort((a, b) => a.minutes - b.minutes);
    const rest = list.filter((r) => r.section === "REST").sort((a, b) => a.minutes - b.minutes);
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

  // Columns = DSWR | current | FRBD | GZBD | GALI | most-recent-result market.
  const monthlyColumns = useMemo(() => {
    const raw = [
      { key: "desawar", label: "DSWR" },
      { key: slug, label: canonical },
      { key: "faridabad", label: "FRBD" },
      { key: "ghaziabad", label: "GZBD" },
      { key: "gali", label: "GALI" },
      ...(recentSlug ? [{ key: recentSlug, label: titleFromSlug(recentSlug) }] : []),
    ];
    const seen = new Set<string>();
    return raw.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
  }, [slug, canonical, recentSlug]);

  const monthlyRows = useMemo(
    () => (sel ? buildMonthlyRows(monthlyColumns, sel, monthCharts, today, nowMinutes, firstEntryBySlug) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, monthCharts, firstEntryBySlug, minuteKey, monthlyColumns, today.day]
  );

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

  const companionNames = monthlyColumns.filter((c) => c.key !== slug).map((c) => titleFromSlug(c.key)).join(", ");
  const tagline = `${canonical} Satta Result And Monthly Satta Chart of ${MONTH_NAMES[today.month - 1]} ${today.year} With Combined Chart of ${companionNames} From Dhan Kuber, Dhan Kuber Result, Dhan Kuber Chart and Dhan Kuber 786.`;

  /* --------------------------------- render -------------------------------- */
  return (
    <div className="flex min-h-screen flex-col bg-[#ececec]">
      <SiteHeader tagline={tagline} />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16">
        <p suppressHydrationWarning className="mt-4 text-center text-sm text-[#16a34a]">
          Updated: {MONTH_NAMES[now.getMonth()]} {now.getDate()}, {now.getFullYear()}, {clock} IST.
        </p>

        <div className="mt-6 space-y-6">
          {/* companion table: current + 4 permanent + most-recent */}
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
              title={`${canonical} Satta Result Chart of ${MONTH_NAMES[selMonth - 1]} ${selYear} with ${companionNames}`}
              columns={monthlyColumns}
              rows={monthlyRows}
              prevLabel={`${MONTH_SHORT[prevDate.getMonth()]} ${prevDate.getFullYear()}`}
              nextLabel={`${MONTH_SHORT[nextDate.getMonth()]} ${nextDate.getFullYear()}`}
              onPrev={() => navigateMonth(prevDate.getMonth() + 1, prevDate.getFullYear())}
              onNext={() => navigateMonth(nextDate.getMonth() + 1, nextDate.getFullYear())}
              latestLabel={`Click here to view the latest chart for ${companionNames} for ${MONTH_NAMES[today.month - 1]}-${today.year}`}
              onLatest={() => navigateMonth(today.month, today.year)}
              selectorLabel={`Select a month and year to view the combined chart for ${canonical}, ${companionNames}.`}
              selectedMonth={selMonth}
              selectedYear={selYear}
              onGo={(m, y) => navigateMonth(m, y)}
            />
          </div>

          {/* full daily results table (all markets), like the reference */}
          <LiveResultsTable
            banner={`Dhan Kuber Results of ${longDate(today)} & ${longDate(yesterday)}`}
            col1={`${weekdayOf(yesterday)}. ${ordinal(yesterday.day)}`}
            col2={`${weekdayOf(today)}. ${ordinal(today.day)}`}
            sections={booted ? sections : []}
            showFooter
          />
        </div>
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  );
}