export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";

async function connectWithRetry(attempts = 5): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await connectDB();
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function GET(request: NextRequest) {
  try {
    await connectWithRetry();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const chartName = searchParams.get("chartName");
    const now = new Date();
    const query: Record<string, unknown> = {
      isActive: true,
      $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }, { scheduledAt: { $lte: now } }],
    };
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (date) query.date = parseInt(date);
    if (chartName) query.chartName = chartName;
    const charts = await Chart.find(query).sort({ displayOrder: 1, chartName: 1 }).lean();
    return NextResponse.json({
      success: true,
      data: charts.map((c) => ({
        id: c._id.toString(),
        chartName: c.chartName,
        result: c.result,
        openingResult: c.openingResult,
        closingResult: c.closingResult,
        date: c.date,
        month: c.month,
        year: c.year,
        displayOrder: c.displayOrder,
          isHighlighted: c.isHighlighted,
          isActive: c.isActive,
          scheduledAt: c.scheduledAt,
          drawTime: c.drawTime,
          formattedDate: c.formattedDate,
          updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching charts:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch charts" }, { status: 500 });
  }
}