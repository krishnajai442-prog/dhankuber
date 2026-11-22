"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Loading } from "@/components/shared/Loading";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { clsx } from "clsx";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Username or email is required";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(data.data?.redirect || "/admin/dashboard");
        router.refresh();
      } else {
        setError(data.message || "Login failed");
        if (data.errors) {
          setFormErrors(data.errors);
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6" aria-label="Dhan Kuber Home">
            <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">SK</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Sign in to manage charts and results</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3 text-danger-700" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Username or Email"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={formErrors.username}
              placeholder="Enter username or email"
              autoComplete="username"
              disabled={isLoading}
            />

            <div className="relative">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={clsx(
                    "input pr-12",
                    formErrors.password && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                  )}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1.5 text-sm text-danger-600" role="alert">{formErrors.password}</p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full bg-blue-600 text-white hover:bg-blue-700" loading={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back to Website
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Default credentials: admin / admin123</p>
          <p>Change password after first login</p>
        </div>
      </div>
    </div>
  );
}