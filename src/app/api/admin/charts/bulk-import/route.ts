export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import { getDefaultDrawTime } from "@/lib/markets";

/* DSWR / FRBD / GZBD / GALI → internal slugs (full names also accepted). */
const COLUMN_MAP: Record<string, string> = {
  DSWR: "desawar", DESAWAR: "desawar", DESAWER: "desawar",
  FRBD: "faridabad", FARIDABAD: "faridabad",
  GZBD: "ghaziabad", GHAZIABAD: "ghaziabad", GAZIABAD: "ghaziabad",
  GALI: "gali",
};
const NAMES: Record<string, string> = {
  desawar: "Desawar", faridabad: "Faridabad", ghaziabad: "Ghaziabad", gali: "Gali",
};
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];

interface ParsedRow { year: number; month: number; day: number; values: Record<string, string>; }

/** Parses one OR many month blocks pasted together. */
function parseChartText(text: string, fallback?: { month: number; year: number }) {
  const rows: ParsedRow[] = [];
  const notes: string[] = [];
  let cur: { month: number; year: number } | null = fallback ?? null;
  let cols: (string | null)[] | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // "… Chart of November 2026 for …"  → starts a new month block
    const hm = line.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
    if (hm) {
      cur = { month: MONTHS.indexOf(hm[1].toLowerCase()) + 1, year: parseInt(hm[2], 10) };
      cols = null;
      continue;
    }

    const tokens = line.split(/\t+|\s+/).filter(Boolean);

    // "DATE  DSWR  FRBD  GZBD  GALI"
    if (/^date$/i.test(tokens[0])) {
      cols = tokens.slice(1).map((t) => COLUMN_MAP[t.toUpperCase().replace(/[^A-Z]/g, "")] ?? null);
      continue;
    }

    // data row must start with a day number
    if (!/^\d{1,2}$/.test(tokens[0])) continue;
    if (!cur || !cols) {
      notes.push(`Skipped "${line.slice(0, 40)}" — no month/year header above it`);
      continue;
    }
    const day = parseInt(tokens[0], 10);
    if (day < 1 || day > 31) continue;

    const values: Record<string, string> = {};
    cols.forEach((slug, i) => {
      const v = tokens[i + 1];
      if (!slug || !v) return;           // missing trailing cells are simply absent
      values[slug] = v.toUpperCase();     // keeps "02", "XX", "--" exactly as pasted
    });
    if (Object.keys(values).length) rows.push({ year: cur.year, month: cur.month, day, values });
  }
  return { rows, notes };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !["super_admin", "admin", "editor"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const text: string = body?.text || "";
    const dryRun: boolean = Boolean(body?.dryRun);
    const fallback = body?.month && body?.year
      ? { month: Number(body.month), year: Number(body.year) }
      : undefined;

    if (!text.trim()) {
      return NextResponse.json({ success: false, message: "Paste the chart text first" }, { status: 400 });
    }

    const { rows, notes } = parseChartText(text, fallback);
    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No rows recognised. Include a '… November 2026 …' line and a 'DATE DSWR FRBD GZBD GALI' header.",
        notes,
      }, { status: 400 });
    }

    // Build upsert operations — one per (market, day)
    const ops = rows.flatMap((r) =>
      Object.entries(r.values).map(([slug, value]) => ({
        updateOne: {
          filter: { chartName: NAMES[slug], date: r.day, month: r.month, year: r.year },
          update: {
            $set: { result: value, isActive: true, drawTime: getDefaultDrawTime(slug) },
            $setOnInsert: {
              chartName: NAMES[slug], date: r.day, month: r.month, year: r.year,
              displayOrder: 0, isHighlighted: false,
            },
          },
          upsert: true,
        },
      }))
    );

    const months = Array.from(new Set(rows.map((r) => `${r.year}-${String(r.month).padStart(2, "0")}`))).sort();

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Preview: ${ops.length} cells across ${rows.length} days / ${months.length} month(s)`,
        data: { dryRun: true, cells: ops.length, days: rows.length, months, notes, sample: rows.slice(0, 5) },
      });
    }

    if (ops.length > 20000) {
      return NextResponse.json({ success: false, message: "Too many cells in one go — paste fewer months at a time (max ~20,000)." }, { status: 400 });
    }

    await connectDB();
    const res = await Chart.bulkWrite(ops, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `Imported ${ops.length} cells — ${res.upsertedCount} new, ${res.modifiedCount} updated.`,
      data: {
        cells: ops.length,
        created: res.upsertedCount,
        updated: res.modifiedCount,
        days: rows.length,
        months,
        notes,
      },
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ success: false, message: "Import failed" }, { status: 500 });
  }
}