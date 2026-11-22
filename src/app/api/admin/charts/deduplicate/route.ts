export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import { canonicalMarketName, marketKey } from "@/lib/markets";

/**
 * Merges case-variant duplicates (Sadabahar / sadabahar → one table).
 * For each (market, date) keeps the MOST RECENTLY UPDATED entry, deletes the rest,
 * then normalizes every remaining chartName to canonical Title Case.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !["super_admin", "admin"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const all = await Chart.find({}).sort({ updatedAt: -1 }).lean();
    const kept = new Map<string, (typeof all)[number]>();
    const toDelete: string[] = [];

    for (const c of all) {
      const key = `${marketKey(c.chartName)}|${c.date}|${c.month}|${c.year}`;
      if (!kept.has(key)) kept.set(key, c);
      else toDelete.push(c._id.toString());
    }

    if (toDelete.length > 0) {
      await Chart.deleteMany({ _id: { $in: toDelete } });
    }

    let renamed = 0;
    for (const c of Array.from(kept.values())) {
      const canon = canonicalMarketName(c.chartName);
      if (canon && canon !== c.chartName) {
        await Chart.updateOne({ _id: c._id }, { $set: { chartName: canon } });
        renamed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Merged duplicates: ${toDelete.length} deleted, ${renamed} renamed. ${kept.size} unique tables remain.`,
      data: { deleted: toDelete.length, renamed, tables: kept.size },
    });
  } catch (error) {
    console.error("Deduplicate error:", error);
    return NextResponse.json({ success: false, message: "Failed to merge duplicates" }, { status: 500 });
  }
}