export const dynamic = "force-dynamic";

import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import { chartFilterSchema, chartSchema } from "@/lib/validations";
import { canonicalMarketName, escapeRegExp, marketKey, SPECIAL_MARKETS } from "@/lib/markets";

function formatChartDate(date: number, month: number, year: number): string {
  return `${String(date).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !["super_admin", "admin", "editor"].includes(payload.role)) return null;
  return payload;
}

const byName = (a: { chartName: string }, b: { chartName: string }) =>
  a.chartName.localeCompare(b.chartName, undefined, { sensitivity: "base" });

export async function GET(request: NextRequest) {
  try {
    const payload = await checkAuth();
    if (!payload) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const validation = chartFilterSchema.safeParse(Object.fromEntries(searchParams));
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid filters", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { search, date, month, year, isActive, page, limit, sortBy, sortOrder } = validation.data;

    const query: Record<string, unknown> = {};
    if (search) query.chartName = { $regex: escapeRegExp(search), $options: "i" };
    if (date) query.date = date;
    if (month) query.month = month;
    if (year) query.year = year;
    if (isActive && isActive !== "all") query.isActive = isActive === "true";

    // Special 4 view: only the permanent special tables (any date).
    if (searchParams.get("special") === "1") {
      query.$or = SPECIAL_MARKETS.map((n) => ({
        chartName: { $regex: `^${escapeRegExp(n)}$`, $options: "i" },
      }));
    }
        if (searchParams.get("special") === "1") {
      query.$or = SPECIAL_MARKETS.map((n) => ({
        chartName: { $regex: `^${escapeRegExp(n)}$`, $options: "i" },
      }));
    }

    const latestOnly = searchParams.get("latest") === "1";

    type LeanChart = {
      _id: mongoose.Types.ObjectId;
      chartName: string;
      result: string;
      openingResult?: string;
      closingResult?: string;
      date: number;
      month: number;
      year: number;
      displayOrder: number;
      isHighlighted: boolean;
      isActive: boolean;
      scheduledAt?: unknown;
      drawTime?: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    let charts: LeanChart[] = [];
    let total = 0;

    if (latestOnly) {
      // ONE row per market (case-insensitive) = its latest entry, listed A → Z.
      const all = (await Chart.find(query)
        .sort({ year: -1, month: -1, date: -1, updatedAt: -1 })
        .lean()) as unknown as LeanChart[];
      const seen = new Set<string>();
      const grouped: LeanChart[] = [];
      for (const c of all) {
        const key = marketKey(c.chartName);
        if (!seen.has(key)) {
          seen.add(key);
          grouped.push(c);
        }
      }
      grouped.sort(byName);
      total = grouped.length;
      charts = grouped.slice((page - 1) * limit, page * limit);
    } else {
      const dir: 1 | -1 = sortOrder === "asc" ? 1 : -1;
      const sort: Record<string, 1 | -1> =
        sortBy === "chartName"
          ? { chartName: dir, year: -1, month: -1, date: -1 }
          : { [sortBy]: dir, chartName: 1 };
      const [c, t] = await Promise.all([
        Chart.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
        Chart.countDocuments(query),
      ]);
      charts = c as unknown as LeanChart[];
      total = t;
    }

    return NextResponse.json({
      success: true,
      data: {
        charts: charts.map((c) => ({
          id: c._id.toString(),
          chartName: c.chartName,
          result: c.result,
          date: c.date,
          month: c.month,
          year: c.year,
          displayOrder: c.displayOrder,
          isHighlighted: c.isHighlighted,
          isActive: c.isActive,
          scheduledAt: c.scheduledAt,
          drawTime: c.drawTime,
          formattedDate: formatChartDate(c.date, c.month, c.year),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Error fetching charts:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch charts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await checkAuth();
    if (!payload) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = chartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    // Canonical casing + case-insensitive duplicate guard
    const data = { ...validation.data, chartName: canonicalMarketName(validation.data.chartName) };
    const existing = await Chart.findOne({
      chartName: { $regex: `^${escapeRegExp(data.chartName)}$`, $options: "i" },
      date: data.date,
      month: data.month,
      year: data.year,
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A chart with this name and date already exists (case-insensitive)" },
        { status: 409 }
      );
    }

    const chart = await Chart.create(data);

    return NextResponse.json({
      success: true,
      message: "Chart created successfully",
      data: { id: (chart._id as mongoose.Types.ObjectId).toString(), ...chart.toObject() },
    });
  } catch (error) {
    console.error("Error creating chart:", error);
    return NextResponse.json({ success: false, message: "Failed to create chart" }, { status: 500 });
  }
}