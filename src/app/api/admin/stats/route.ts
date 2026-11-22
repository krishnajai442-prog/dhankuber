export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import { marketKey } from "@/lib/markets";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();

    // ONE row per table (market): keep only the LATEST entry of each market,
    // so previous-day history never doubles/triples the counts.
    const allCharts = await Chart.find({})
      .sort({ year: -1, month: -1, date: -1, updatedAt: -1 })
      .lean();

    const latestByMarket = new Map<string, (typeof allCharts)[number]>();
    for (const c of allCharts) {
      const key = marketKey(c.chartName); // Sadabahar === sadabahar
      if (!latestByMarket.has(key)) latestByMarket.set(key, c);
    }
    const markets = Array.from(latestByMarket.values());

    const isToday = (c: { date: number; month: number; year: number }) =>
      c.date === d && c.month === m && c.year === y;

    // TOTAL CHARTS = unique tables (never multiplied by history)
    const totalCharts = markets.length;
    // ACTIVE RESULTS = ONLY the CURRENT DATE's tables that are Active.
    // (A table's entry for today is always created/updated today, so this equals
    //  "tables updated on the current date" — history never counts here.)
    const totalResults = markets.filter(
    (c) => c.isActive && isToday(c) && (c.result || "").trim() !== ""
  ).length;
    // TODAY'S ENTRIES = unique tables that have an entry dated today (always ≤ Total)
    const todaysEntries = markets.filter((c) => isToday(c)).length;

    // List order: up-to-date active tables first, then the ones that need update
    markets.sort((a, b) => {
      const aNeed = !a.isActive || !isToday(a) ? 1 : 0;
      const bNeed = !b.isActive || !isToday(b) ? 1 : 0;
      if (aNeed !== bNeed) return aNeed - bNeed;
      if (isToday(a) !== isToday(b)) return isToday(a) ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCharts,
        totalResults,
        todaysEntries,
        latestCharts: markets.slice(0, 200).map((c) => ({
          id: c._id.toString(),
          chartName: c.chartName,
          result: c.result,
          date: c.date,
          month: c.month,
          year: c.year,
          isActive: c.isActive,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          scheduledAt: c.scheduledAt,
        })),
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}