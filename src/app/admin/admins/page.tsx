// src/app/admin/admins/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Loading } from "@/components/shared/Loading";
import { Button } from "@/components/shared/Button";
import { Shield, User, Mail, KeyRound } from "lucide-react";
import { clsx } from "clsx";

interface AdminData {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminAdminsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminData | null>(null);
  const [allAdmins, setAllAdmins] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current logged-in user
        const meRes = await fetch("/api/admin/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success) setCurrentUser(meData.data);
          else router.push("/admin/login");
        } else {
          router.push("/admin/login");
        }

        // Fetch all admins
        const adminsRes = await fetch("/api/admin/admins");
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          if (adminsData.success) setAllAdmins(adminsData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (isLoading || !currentUser) {
    return (
      <div className="admin-layout">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={currentUser || undefined} />
        <div className="admin-main">
          <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} user={currentUser!} pageTitle="Admin Management" breadcrumbs={[{ label: "Admins" }]} />
          <div className="admin-content"><Loading text="Loading admins..." /></div>
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
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={currentUser} />
      
      <div className="admin-main">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} user={currentUser} pageTitle="Admin Management" breadcrumbs={[{ label: "Admins" }]} />
        
        <div className="admin-content space-y-8">
          {/* Current Admin Details Card */}
          <div className="card p-6 border-2 border-primary-200 bg-primary-50/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary-100">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Account Details</h2>
                <p className="text-sm text-gray-500">Currently logged in as <span className="font-bold text-primary-700">{currentUser.username}</span></p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
                  <p className="font-semibold text-gray-900">{currentUser.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="font-semibold text-gray-900">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                  <p className="font-semibold text-gray-900 capitalize">{currentUser.role.replace("_", " ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <KeyRound className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Password</p>
                  <p className="font-semibold text-gray-900">•••••••••••• (Encrypted)</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Why can't I see my password?</p>
                <p className="text-sm text-yellow-700 mt-1">
                  For your security, your password is encrypted using <strong>bcrypt</strong> and stored as a one-way hash in the database. 
                  It is mathematically impossible for anyone (even the system administrators) to view or decrypt your original password. 
                  If you need to change it, please use the button below.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={() => router.push("/admin/settings")}>
                <KeyRound className="w-4 h-4 mr-2" />
                Change My Password
              </Button>
            </div>
          </div>

          {/* All Admins Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">All System Administrators</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdmins.map((admin) => (
                    <tr key={admin.id} className={clsx("border-b border-gray-100 hover:bg-gray-50", admin.id === currentUser.id && "bg-primary-50")}>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        {admin.username}
                        {admin.id === currentUser.id && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">You</span>}
                      </td>
                      <td className="px-6 py-4">{admin.email}</td>
                      <td className="px-6 py-4 capitalize">{admin.role.replace("_", " ")}</td>
                      <td className="px-6 py-4">
                        {admin.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}