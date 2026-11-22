export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";

export async function GET(request: NextRequest) {
  try {
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