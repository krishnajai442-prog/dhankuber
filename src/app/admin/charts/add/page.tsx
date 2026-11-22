"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ChartForm } from "@/components/admin/ChartForm";
import { Loading } from "@/components/shared/Loading";
import { clsx } from "clsx";

export default function AdminChartAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableDates, setAvailableDates] = useState<number[]>([]);
  const [error, setError] = useState("");

    // Pre-fill from ?market=&date=&month=&year= (sent by "Needs update" rows)
  const initialData = useMemo(() => {
    const market = searchParams.get("market");
    const date = parseInt(searchParams.get("date") || "", 10);
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);
    return {
      ...(market ? { chartName: market } : {}),
      ...(date ? { date } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    };
  }, [searchParams]);

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
    const fetchYears = async () => {
      try {
        const res = await fetch("/api/admin/charts/years");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setAvailableYears(data.data);
        }
      } catch (err) { console.error(err); }
    };
    fetchYears();
  }, []);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        router.push("/admin/charts");
        router.refresh();
      } else {
        setError(result.message || "Failed to create chart");
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
            pageTitle="Add New Chart"
            breadcrumbs={[{ label: "Charts", href: "/admin/charts" }, { label: "Add New" }]}
          />
          <div className="admin-content">
            <Loading text="Loading..." />
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
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={user || undefined}
      />
      <div className="admin-main">
        <AdminHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user!}
          pageTitle="Add New Chart"
          breadcrumbs={[{ label: "Charts", href: "/admin/charts" }, { label: "Add New" }]}
        />
        <div className="admin-content max-w-3xl mx-auto">
          <div className="card p-6">
              <ChartForm
              initialData={initialData}
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