"use client";

import { Menu, Bell, Sun, Moon, User } from "lucide-react";
import { clsx } from "clsx";

interface AdminHeaderProps {
  onMenuClick?: () => void;
  user?: {
    username: string;
    role: string;
  };
  pageTitle: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AdminHeader({ onMenuClick, user, pageTitle, breadcrumbs = [] }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <nav className="hidden sm:flex" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <a href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</a>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.label} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {crumb.href ? (
                      <a href={crumb.href} className="text-gray-500 hover:text-gray-700">{crumb.label}</a>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <button type="button" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Toggle theme">
                <Sun className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
        </div>
      </div>
    </header>
  );
}