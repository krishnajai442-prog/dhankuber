"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { Loading } from "@/components/shared/Loading";
import { Menu } from "lucide-react";
import { clsx } from "clsx";

interface DashboardData {
  totalCharts: number;
  totalResults: number;
  todaysEntries: number;
  latestCharts: Array<{
    id: string;
    chartName: string;
    result: string;
    date: number;
    month: number;
    year: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    scheduledAt?: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
          } else {
            router.push("/admin/login");
          }
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

     const boot = async () => {
      // Create today's default-market tables first so counts & list include them
      try {
        await fetch("/api/admin/charts/ensure-defaults", { method: "POST" });
      } catch {}
      await fetchStats();
    };
    fetchAuth();
    boot();
  }, [router]);

  if (isLoading || !user || !stats) {
    return (
      <div className="admin-layout">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={user || undefined} />
        <div className="admin-main">
          <AdminHeader
            onMenuClick={() => setIsSidebarOpen(true)}
            user={user!}
            pageTitle="Dashboard"
            breadcrumbs={[]}
          />
          <div className="admin-content">
            <Loading text="Loading dashboard..." />
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
          user={user}
          pageTitle="Dashboard"
          breadcrumbs={[]}
        />
        <div className="admin-content">
          <DashboardStats stats={stats} latestCharts={stats.latestCharts} />
        </div>
      </div>
    </div>
  );
}