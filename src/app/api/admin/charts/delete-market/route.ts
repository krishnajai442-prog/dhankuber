export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";

/**
 * Delete ALL entries of a market across all dates.
 * This is a dangerous operation — it removes the entire market's history.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    // Only super_admin and admin can delete entire markets
    if (!payload || !["super_admin", "admin"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { marketName } = await request.json();
    if (!marketName || marketName.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Market name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Delete all entries matching this market name (case-insensitive)
    const result = await Chart.deleteMany({
      chartName: { $regex: `^${marketName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} entries of "${marketName}" across all dates`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Delete market error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete market" },
      { status: 500 }
    );
  }
}