"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ChartForm } from "@/components/admin/ChartForm";
import { Loading } from "@/components/shared/Loading";
import { clsx } from "clsx";

interface ChartData {
  id: string;
  chartName: string;
  result: string;
  openingResult?: string;
  closingResult?: string;
  date: number;
  month: number;
  year: number;
  displayOrder: number;
  isHighlighted: boolean;
  isActive: boolean;
  scheduledAt?: string | null;
  drawTime?: string | null;
}

export default function AdminChartEditPage() {
  const params = useParams();
  const router = useRouter();
  const chartId = params.id as string;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableDates, setAvailableDates] = useState<number[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUser(data.data);
          else router.push("/admin/login");
        } else router.push("/admin/login");
      } catch { router.push("/admin/login"); }
      finally { setIsLoading(false); }
    };
    fetchAuth();
  }, [router]);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch(`/api/admin/charts/${chartId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setChart(data.data);
            setAvailableDates([data.data.date]);
            setAvailableMonths([data.data.month]);
            setAvailableYears([data.data.year]);
          } else {
            router.push("/admin/charts");
          }
        } else {
          router.push("/admin/charts");
        }
      } catch (err) {
        console.error(err);
        router.push("/admin/charts");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchYears = async () => {
      try {
        const res = await fetch("/api/admin/charts/years");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setAvailableYears(data.data);
        }
      } catch (err) { console.error(err); }
    };

    fetchChart();
    fetchYears();
  }, [chartId, router]);

  useEffect(() => {
    if (chart?.year) {
      const fetchMonths = async () => {
        try {
          const res = await fetch(`/api/admin/charts/months?year=${chart.year}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) setAvailableMonths(data.data);
          }
        } catch (err) { console.error(err); }
      };
      fetchMonths();
    }
  }, [chart?.year]);

  useEffect(() => {
    if (chart?.year && chart?.month) {
      const fetchDates = async () => {
        try {
          const res = await fetch(`/api/admin/charts/dates?year=${chart.year}&month=${chart.month}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) setAvailableDates(data.data);
          }
        } catch (err) { console.error(err); }
      };
      fetchDates();
    }
  }, [chart?.year, chart?.month]);

  const handleSubmit = async (data: Omit<typeof chart, "id">) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/charts/${chartId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        router.push("/admin/charts");
        router.refresh();
      } else {
        setError(result.message || "Failed to update chart");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-layout">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={user || undefined} />
        <div className="admin-main">
          <AdminHeader
            onMenuClick={() => setIsSidebarOpen(true)}
            user={user!}
            pageTitle="Edit Chart"
            breadcrumbs={[{ label: "Charts", href: "/admin/charts" }, { label: "Edit" }]}
          />
          <div className="admin-content">
            <Loading text="Loading chart..." />
          </div>
        </div>
      </div>
    );
  }

  if (!chart) {
    return null;
  }

  return (
    <div className="admin-layout">
      <div
        className={clsx("fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={user || undefined}
      />
      <div className="admin-main">
        <AdminHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user!}
          pageTitle="Edit Chart"
          breadcrumbs={[{ label: "Charts", href: "/admin/charts" }, { label: "Edit" }]}
        />
        <div className="admin-content max-w-3xl mx-auto">
          <div className="card p-6">
              <ChartForm
              initialData={{
                ...chart,
                scheduledAt: chart.scheduledAt ?? undefined,
                drawTime: chart.drawTime ?? undefined,
              }}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              isLoading={isSubmitting}
              availableYears={availableYears}
              availableMonths={availableMonths}
              availableDates={availableDates}
            />
            {error && (
              <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}