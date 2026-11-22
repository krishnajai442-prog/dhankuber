"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ChartTable } from "@/components/admin/ChartTable";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Select } from "@/components/shared/Select";
import { Loading } from "@/components/shared/Loading";
import { Plus, Search, X, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { getDrawTime, istNow, marketKey, minutesOf, slugify } from "@/lib/markets";

/* ---------------------------------- types --------------------------------- */

interface ChartData {
  id: string;
  chartName: string;
  result: string;
  date: number;
  month: number;
  year: number;
  displayOrder: number;
  isHighlighted: boolean;
  isActive: boolean;
  formattedDate: string;
  drawTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
  stale?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ViewMode = "today" | "tables" | "alldates";

/* --------------------------------- helpers -------------------------------- */

/** Fresh IST "today" strings (same clock as the urgency sort; correct across midnight). */
function todayParts() {
  const n = istNow();
  return {
    date: String(n.getDate()),
    month: String(n.getMonth() + 1),
    year: String(n.getFullYear()),
  };
}

const byName = (a: ChartData, b: ChartData) =>
  a.chartName.localeCompare(b.chartName, undefined, { sensitivity: "base" });

async function readCharts(res: Response): Promise<ChartData[]> {
  if (!res.ok) return [];
  const d = await res.json();
  return d?.success ? (d.data.charts as ChartData[]) : [];
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: new Date(2000, i).toLocaleString("default", { month: "long" }),
}));

/* ---------------------------------- page ---------------------------------- */

export default function AdminChartsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // layout / auth
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  // data
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // view + filters (seeded from URL)
  const initialView: ViewMode =
    searchParams.get("view") === "tables" ? "tables" : searchParams.get("view") === "alldates" ? "alldates" : "today";
  const [view, setView] = useState<ViewMode>(initialView);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || (initialView === "today" ? todayParts().date : ""));
  const [monthFilter, setMonthFilter] = useState(searchParams.get("month") || (initialView === "today" ? todayParts().month : ""));
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") || (initialView === "today" ? todayParts().year : ""));
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  /* ------------------------------ auth + years ----------------------------- */
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUser(data.data);
          else router.push("/admin/login");
        } else router.push("/admin/login");
      } catch {
        router.push("/admin/login");
      }
    };
    fetchAuth();
  }, [router]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch("/api/admin/charts/years");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setAvailableYears(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchYears();
  }, []);

  /* -------------------------------- fetching ------------------------------- */
  const fetchCharts = async (page = 1) => {
    setIsLoading(true);
    try {
      const base = new URLSearchParams({ page: "1", limit: "100", sortBy: "chartName", sortOrder: "asc" });
      if (search) base.set("search", search);
      if (statusFilter !== "all") base.set("isActive", statusFilter);

      if (view === "today") {
        // Tables that already have a row for the selected date…
        const updatedParams = new URLSearchParams(base);
        if (dateFilter) updatedParams.set("date", dateFilter);
        if (monthFilter) updatedParams.set("month", monthFilter);
        if (yearFilter) updatedParams.set("year", yearFilter);
        const updatedRows = await readCharts(await fetch(`/api/admin/charts?${updatedParams}`));

        // …plus tables that still need today's update (latest entry of each market).
        let staleRows: ChartData[] = [];
        if (statusFilter === "all") {
          const staleParams = new URLSearchParams(base);
          staleParams.set("latest", "1");
          const latestRows = await readCharts(await fetch(`/api/admin/charts?${staleParams}`));
          const updatedNames = new Set(updatedRows.map((r) => marketKey(r.chartName)));
          staleRows = latestRows
            .filter((r) => !updatedNames.has(marketKey(r.chartName)))
            .map((r) => ({ ...r, stale: true }));
        }

        // ACTION ORDER: nearest UPCOMING draw first (22:25 → 22:50 → 23:15 …),
        // wrapping past midnight so already-drawn tables come after the last draw.
               // ACTION ORDER (3 tiers):
        //  1) needs action & draw time passed (pending result / no entry today) → most overdue first
        //  2) upcoming draws → next one first (22:25 → 22:50 → 23:15 …)
        //  3) already published → last
        const now = istNow();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const drawMins = (r: ChartData) => minutesOf(getDrawTime(slugify(r.chartName), r.drawTime));
        const needsAction = (r: ChartData) => Boolean(r.stale) || !(r.result || "").trim();
        const actionKey = (r: ChartData) => {
          const m = drawMins(r);
          const passed = nowMinutes >= m;
          if (passed && needsAction(r)) return -(nowMinutes - m); // overdue: earliest first
          if (!passed) return m - nowMinutes;                    // upcoming: next first
          return 1_000_000 + (nowMinutes - m);                   // published: last
        };
        const combined = [...updatedRows, ...staleRows].sort(
          (a, b) => actionKey(a) - actionKey(b) || byName(a, b)
        );

        const limit = pagination.limit;
        const total = combined.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        setCharts(combined.slice((safePage - 1) * limit, safePage * limit));
        setPagination({ page: safePage, limit, total, totalPages });
      } else {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          sortBy: "chartName",
          sortOrder: "asc",
        });
        if (view === "tables") params.set("latest", "1");
        if (search) params.set("search", search);
        if (dateFilter) params.set("date", dateFilter);
        if (monthFilter) params.set("month", monthFilter);
        if (yearFilter) params.set("year", yearFilter);
        if (statusFilter !== "all") params.set("isActive", statusFilter);

        const res = await fetch(`/api/admin/charts?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCharts(data.data.charts);
            setPagination(data.data.pagination);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, dateFilter, monthFilter, yearFilter, statusFilter, view]);

    // Re-sort every minute so the top always tracks the clock (today view only).
  useEffect(() => {
    if (view !== "today") return;
    const t = setInterval(() => fetchCharts(pagination.page), 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pagination.page]);

  // On first load: merge case-duplicates, sync default markets, then refresh.
  useEffect(() => {
    const boot = async () => {
      try {
        await fetch("/api/admin/charts/deduplicate", { method: "POST" });
      } catch (err) {
        console.error(err);
      }
      try {
        const res = await fetch("/api/admin/charts/ensure-defaults", { method: "POST" });
        if (res.ok) fetchCharts(1);
      } catch (err) {
        console.error(err);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------- actions -------------------------------- */
  const switchView = (v: ViewMode) => {
    const t = todayParts();
    setView(v);
    if (v === "today") {
      setDateFilter(t.date);
      setMonthFilter(t.month);
      setYearFilter(t.year);
    } else {
      setDateFilter("");
      setMonthFilter("");
      setYearFilter("");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCharts(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    switchView("today");
  };

  const openForRow = (chart: ChartData) => {
    if (chart.stale) {
      const t = todayParts();
      const q = new URLSearchParams({
        market: chart.chartName,
        date: dateFilter || t.date,
        month: monthFilter || t.month,
        year: yearFilter || t.year,
      });
      router.push(`/admin/charts/add?${q.toString()}`);
    } else {
      router.push(`/admin/charts/edit/${chart.id}`);
    }
  };

  const syncDefaults = async () => {
    const res = await fetch("/api/admin/charts/ensure-defaults", { method: "POST" });
    if (res.ok) fetchCharts(pagination.page);
  };

  const hasFilters = Boolean(search || dateFilter || monthFilter || yearFilter || statusFilter !== "all");

  /* --------------------------------- render -------------------------------- */
  if (isLoading && charts.length === 0) {
    return (
      <div className="admin-layout">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={user || undefined} />
        <div className="admin-main">
          <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} user={user!} pageTitle="Charts Management" breadcrumbs={[{ label: "Charts" }]} />
          <div className="admin-content">
            <Loading text="Loading charts..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div
        className={clsx("fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={user || undefined} />

      <div className="admin-main">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} user={user!} pageTitle="Charts Management" breadcrumbs={[{ label: "Charts" }]} />

        <div className="admin-content">
          {/* header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Charts</h2>
              <p className="text-sm text-gray-500">
                {view === "today" && statusFilter === "all" && (
                <>Showing <span className="font-semibold text-gray-700">today's</span> tables in <span className="font-semibold text-gray-700">action order</span> — overdue / pending results first, then the next upcoming draws, published tables last. Click a row to edit / update it.</>
                )}
                {view === "today" && statusFilter === "true" && (
                  <>Showing <span className="font-semibold text-gray-700">Active Results</span> in action order (next draw first) — only charts updated for the current date.</>
                )}
                {view === "today" && statusFilter === "false" && (
                  <>Showing <span className="font-semibold text-gray-700">inactive</span> charts in action order for the current date.</>
                )}
                {view === "tables" && (
                  <>Showing <span className="font-semibold text-gray-700">all tables</span> A → Z (latest entry of each market) — same count as Total Charts.</>
                )}
                {view === "alldates" && (
                  <>Showing <span className="font-semibold text-gray-700">every entry</span> A → Z (full history, all dates).</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={syncDefaults}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Default Markets
              </Button>
              <Link href="/admin/charts/add" className="btn btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Chart
              </Link>
            </div>
          </div>

          {/* filters */}
          <div className="card mb-6">
            <form onSubmit={handleSearch} className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Input label="Search" placeholder="Chart name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <Select
                  label="Year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  options={availableYears.map((y) => ({ value: y.toString(), label: y.toString() }))}
                  placeholder="All Years"
                />
                <Select label="Month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} options={MONTH_OPTIONS} placeholder="All Months" />
                <Input label="Date" type="number" min={1} max={31} placeholder="DD" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "all", label: "All" },
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-2">
                <Button type="submit" variant="primary">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Button type="button" variant={view === "today" ? "secondary" : "outline"} onClick={() => switchView("today")}>
                  Today
                </Button>
                <Button type="button" variant={view === "tables" ? "secondary" : "outline"} onClick={() => switchView("tables")}>
                  All Tables
                </Button>
                <Button type="button" variant={view === "alldates" ? "secondary" : "outline"} onClick={() => switchView("alldates")}>
                  All Dates
                </Button>
                {hasFilters && (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* table */}
          <ChartTable
            charts={charts}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={fetchCharts}
            onRowClick={openForRow}
            onEdit={openForRow}
            onDelete={async (chart) => {
              const res = await fetch(`/api/admin/charts/${chart.id}`, { method: "DELETE" });
              if (res.ok) fetchCharts(pagination.page);
            }}
            onToggleHighlight={async (chart) => {
              const res = await fetch(`/api/admin/charts/${chart.id}/highlight`, { method: "POST" });
              if (res.ok) fetchCharts(pagination.page);
            }}
            onToggleActive={async (chart) => {
              const res = await fetch(`/api/admin/charts/${chart.id}/active`, { method: "POST" });
              if (res.ok) fetchCharts(pagination.page);
            }}
            onView={(chart) => alert(`View: ${chart.chartName} - ${chart.result} (${chart.formattedDate})`)}
          />
        </div>
      </div>
    </div>
  );
}