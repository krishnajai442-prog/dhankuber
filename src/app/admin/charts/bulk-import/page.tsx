"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/shared/Button";
import { Loading } from "@/components/shared/Loading";
import { Upload, Eye, ArrowLeft } from "lucide-react";

const SAMPLE = `Monthly Result Chart of November 2026
DATE\tDSWR\tFRBD\tGZBD\tGALI
01\tXX\t77\t63\t82
02\t64\t20\t79\t78
03\t99\t51\t15\t74`;

export default function BulkImportPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; data?: any } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const d = await res.json();
          if (d.success) setUser(d.data);
          else router.push("/admin/login");
        } else router.push("/admin/login");
      } catch { router.push("/admin/login"); }
      finally { setIsLoading(false); }
    })();
  }, [router]);

  const send = async (dryRun: boolean) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/charts/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, dryRun }),
      });
      const d = await res.json();
      setResult({ ok: Boolean(d.success), msg: d.message || "Done", data: d.data });
    } catch {
      setResult({ ok: false, msg: "Network error — try again" });
    } finally { setBusy(false); }
  };

  if (isLoading) {
    return (
      <div className="admin-layout">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={user || undefined} />
        <div className="admin-main">
          <AdminHeader user={user!} pageTitle="Bulk Import" breadcrumbs={[{ label: "Charts", href: "/admin/charts" }, { label: "Bulk Import" }]} />
          <div className="admin-content"><Loading text="Loading..." /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} user={user || undefined} />
      <div className="admin-main">
        <AdminHeader user={user!} pageTitle="Bulk Import — Special 4" breadcrumbs={[{ label: "Charts", href: "/admin/charts" }, { label: "Bulk Import" }]} />
        <div className="admin-content max-w-4xl mx-auto space-y-6">

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">Paste monthly charts (Desawar · Faridabad · Ghaziabad · Gali)</h2>
            <p className="mt-1 text-sm text-gray-500">
              Paste one month or many. Each block needs a line containing the month + year (e.g. <em>November 2026</em>) and a
              <span className="font-mono"> DATE DSWR FRBD GZBD GALI</span> header. Tab or space separated both work.
              <strong> XX</strong> and leading zeros (<span className="font-mono">02</span>) are stored exactly as pasted.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={16}
              spellCheck={false}
              placeholder={SAMPLE}
              className="input mt-4 font-mono text-xs leading-relaxed"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => send(true)} disabled={busy || !text.trim()}>
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
              <Button type="button" variant="primary" onClick={() => send(false)} loading={busy} disabled={!text.trim()}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
              <Button type="button" variant="ghost" onClick={() => setText(SAMPLE)} disabled={busy}>
                Load sample
              </Button>
              <Link href="/admin/charts" className="btn btn-ghost ml-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Charts
              </Link>
            </div>
          </div>

          {result && (
            <div className={`card p-6 ${result.ok ? "border-success-200 bg-success-50" : "border-danger-200 bg-danger-50"}`}>
              <p className={`font-semibold ${result.ok ? "text-success-700" : "text-danger-700"}`}>{result.msg}</p>
              {result.data?.months?.length > 0 && (
                <p className="mt-2 text-sm text-gray-700">
                  Months: {result.data.months.join(", ")}
                </p>
              )}
              {result.data?.notes?.length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-xs text-gray-600">
                  {result.data.notes.slice(0, 10).map((n: string, i: number) => <li key={i}>{n}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}