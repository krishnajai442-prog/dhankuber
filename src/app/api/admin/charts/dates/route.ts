export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) {
      return NextResponse.json(
        { success: false, message: "Year and month parameters are required" },
        { status: 400 }
      );
    }

    const dates = await Chart.distinct("date", {
      year: parseInt(year),
      month: parseInt(month),
    }).sort();

    return NextResponse.json({
      success: true,
      data: dates,
    });
  } catch (error) {
    console.error("Error fetching dates:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dates" },
      { status: 500 }
    );
  }
}