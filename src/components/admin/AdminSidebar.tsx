"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  BarChart2,
  PlusCircle,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  user?: {
    username: string;
    role: string;
  };
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/charts", label: "Charts", icon: BarChart2 },
  { href: "/admin/charts/add", label: "Add Chart", icon: PlusCircle },
  { href: "/admin/admins", label: "Admins", icon: Users, roles: ["super_admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings }, // Removed role restriction
];

export function AdminSidebar({ isCollapsed = false, onToggle, user }: AdminSidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || ""));

  return (
    <aside
      className={clsx(
        "admin-sidebar bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      aria-label="Admin navigation"
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href="/admin/dashboard" className="flex items-center gap-2" aria-label="Admin Dashboard">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">SK</span>
          </div>
          {!isCollapsed && <span className="font-bold text-xl text-gray-900">Admin Panel</span>}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main admin menu">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                isCollapsed && "justify-center"
              )}
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className={clsx("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-medium text-sm">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <form action="/admin/logout" method="POST" className="mt-4">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}