"use client";
import { clsx } from "clsx";
import { BarChart2, CheckCircle, Clock, TrendingUp, PlusCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  trend?: string;
  trendUp?: boolean;
  href?: string;
}

function StatCard({ title, value, icon, iconColor, bgColor, trend, trendUp, href }: StatCardProps) {
  const content = (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={clsx("mt-1 text-sm flex items-center gap-1", trendUp ? "text-success-600" : "text-danger-600")}>
              <TrendingUp className={clsx("w-4 h-4", !trendUp && "rotate-180")} />
              {trend}
            </p>
          )}
        </div>
        <div className={clsx("p-3 rounded-xl", bgColor)}>{icon}</div>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:shadow-md transition-shadow">
        {content}
      </Link>
    );
  }
  return content;
}

interface DashboardStatsProps {
  stats: { totalCharts: number; totalResults: number; todaysEntries: number };
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

export function DashboardStats({ stats, latestCharts }: DashboardStatsProps) {
  const now = new Date();
  const isToday = (c: { date: number; month: number; year: number }) =>
    c.date === now.getDate() && c.month === now.getMonth() + 1 && c.year === now.getFullYear();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
          title="Total Charts"
          value={stats.totalCharts}
          icon={<BarChart2 className="w-6 h-6 text-primary-600" />}
          iconColor="text-primary-600"
          bgColor="bg-primary-100"
          href="/admin/charts?view=tables"
        />
        <StatCard
          title="Active Results"
          value={stats.totalResults}
          icon={<CheckCircle className="w-6 h-6 text-success-600" />}
          iconColor="text-success-600"
          bgColor="bg-success-100"
          href="/admin/charts?view=today&status=true"
        />
        <StatCard
          title="Today's Entries"
          value={stats.todaysEntries}
          icon={<Clock className="w-6 h-6 text-warning-600" />}
          iconColor="text-warning-600"
          bgColor="bg-warning-100"
          href="/admin/charts?view=today"
        />
        <StatCard
          title="Add New Chart"
          value="+"
          icon={<PlusCircle className="w-6 h-6 text-primary-600" />}
          iconColor="text-primary-600"
          bgColor="bg-primary-100"
          href="/admin/charts/add"
        />
      </div>

      {/* ALL tables — Active first, then the ones that need update */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Clock className="w-5 h-5 text-primary-600" />
            All Tables — latest entry each (active first, then needs update)
          </h2>
          <span className="text-sm text-gray-500">{latestCharts.length} tables</span>
        </div>
        <div className="max-h-[520px] divide-y divide-gray-200 overflow-y-auto">
          {latestCharts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No charts added yet</p>
              <Link href="/admin/charts/add" className="mt-4 inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700">
                <PlusCircle className="w-4 h-4" />
                Add your first chart
              </Link>
            </div>
          ) : (
            latestCharts.map((chart) => (
              <Link
                key={chart.id}
                href={`/admin/charts/edit/${chart.id}`}
                className="flex items-center justify-between block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {chart.chartName}
                      {isToday(chart) && <span className="badge badge-primary ml-2">Today</span>}
                      {chart.isActive && <span className="badge badge-success ml-2">Active</span>}
                      {(!chart.isActive || !isToday(chart)) && (
                        <span className="badge badge-warning ml-2 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Needs update
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      Result: <span className="font-mono text-primary-700">{chart.result}</span> •{" "}
                      {chart.date.toString().padStart(2, "0")}/{chart.month.toString().padStart(2, "0")}/{chart.year}
                      {chart.scheduledAt && (
                        <span className="ml-2 text-xs text-warning-600">(Scheduled: {new Date(chart.scheduledAt).toLocaleString()})</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  Updated:{" "}
                  {new Date(chart.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}