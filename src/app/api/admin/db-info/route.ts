export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import { SPECIAL_MARKETS, istNow, istToday } from "@/lib/markets";

export async function GET() {
  try {
    const token = (await cookies()).get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

    await connectDB();
    const t = istToday(istNow());

    const [total, monthTotal, special4] = await Promise.all([
      Chart.countDocuments(),
      Chart.countDocuments({ year: t.year, month: t.month }),
      Chart.countDocuments({ year: t.year, month: t.month, chartName: { $in: SPECIAL_MARKETS } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        environment: process.env.NODE_ENV,
        totalCharts: total,
        chartsThisMonth: monthTotal,
        special4ThisMonth: special4,
        today: `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`,
      },
    });
  } catch (error) {
    console.error("db-info error:", error);
    return NextResponse.json({ success: false, message: "Failed to read database info" }, { status: 500 });
  }
}