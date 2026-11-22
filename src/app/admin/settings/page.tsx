// src/app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Loading } from "@/components/shared/Loading";
import { clsx } from "clsx";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update password." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="admin-layout">
        <AdminSidebar isCollapsed={false} user={user || undefined} />
        <div className="admin-main">
          <AdminHeader user={user!} pageTitle="Settings" breadcrumbs={[{ label: "Settings" }]} />
          <div className="admin-content"><Loading text="Loading..." /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar isCollapsed={false} user={user} />
      <div className="admin-main">
        <AdminHeader user={user} pageTitle="Settings" breadcrumbs={[{ label: "Settings" }]} />
        <div className="admin-content max-w-2xl mx-auto">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary-100">
                <Lock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-500">Update your admin account password</p>
              </div>
            </div>

            {message && (
              <div className={clsx(
                "mb-6 p-4 rounded-lg border flex items-center gap-2",
                message.type === "success" ? "bg-success-50 border-success-200 text-success-700" : "bg-danger-50 border-danger-200 text-danger-700"
              )}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={showPasswords} 
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Show passwords
                </label>
                
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}