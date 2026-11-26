export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";

/**
 * Public charts endpoint — returns ONLY active charts for the requested scope.
 * Query params (all optional): ?year=YYYY &month=M &date=D
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const year = sp.get("year");
    const month = sp.get("month");
    const date = sp.get("date");

    const query: Record<string, unknown> = { isActive: true };
    if (year) query.year = Number(year);
    if (month) query.month = Number(month);
    if (date) query.date = Number(date);

    await connectDB();

    const charts = await Chart.find(query)
      .sort({ displayOrder: 1, chartName: 1, date: 1 })
      .select("chartName result date month year isHighlighted isActive drawTime displayOrder updatedAt")
      .lean();

    return NextResponse.json({ success: true, data: charts });
  } catch (error) {
    console.error("Public charts error:", error);
    return NextResponse.json({ success: false, message: "Failed to load charts", data: [] }, { status: 500 });
  }
}