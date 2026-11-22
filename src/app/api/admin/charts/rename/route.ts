export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !["super_admin", "admin", "editor"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { oldName, newName } = await request.json();
    if (!oldName || !newName || oldName.trim() === "" || newName.trim() === "") {
      return NextResponse.json({ success: false, message: "Both old and new names are required" }, { status: 400 });
    }
    if (oldName === newName) {
      return NextResponse.json({ success: false, message: "New name must be different" }, { status: 400 });
    }

    await connectDB();
    
    // Check for conflicts (unique constraint on chartName + date + month + year)
    const oldEntries = await Chart.find({ chartName: oldName }).select("date month year").lean();
    for (const entry of oldEntries) {
      const conflict = await Chart.findOne({
        chartName: newName,
        date: entry.date,
        month: entry.month,
        year: entry.year,
      });
      if (conflict) {
        return NextResponse.json({
          success: false,
          message: `Cannot rename: An entry for "${newName}" already exists on ${entry.date}/${entry.month}/${entry.year}. Delete the conflicting entry first.`
        }, { status: 409 });
      }
    }

    const result = await Chart.updateMany(
      { chartName: oldName },
      { $set: { chartName: newName } }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully renamed ${result.modifiedCount} entries from "${oldName}" to "${newName}"`,
    });
  } catch (error) {
    console.error("Rename error:", error);
    return NextResponse.json({ success: false, message: "Failed to rename market" }, { status: 500 });
  }
}