export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !["super_admin", "admin", "editor"].includes(payload.role)) {
    return null;
  }

  return payload;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await checkAuth();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const chart = await Chart.findById(id);

    if (!chart) {
      return NextResponse.json(
        { success: false, message: "Chart not found" },
        { status: 404 }
      );
    }

    chart.isActive = !chart.isActive;
    await chart.save();

    return NextResponse.json({
      success: true,
      message: `Chart ${chart.isActive ? "activated" : "deactivated"}`,
      data: { isActive: chart.isActive },
    });
  } catch (error) {
    console.error("Error toggling active:", error);
    return NextResponse.json(
      { success: false, message: "Failed to toggle active status" },
      { status: 500 }
    );
  }
}