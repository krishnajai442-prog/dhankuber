export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";

export async function GET() {
  try {
    await connectDB();

    const years = (await Chart.distinct("year")).filter((y: number) => y >= 2015);
    const currentYear = new Date().getFullYear();
    // Generate years from 2012 to current year only
    const allYears = Array.from({ length: currentYear - 2012 + 1 }, (_, i) => 2012 + i);
    const combinedYears = Array.from(new Set([...years, ...allYears])).sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      data: combinedYears,
    });
  } catch (error) {
    console.error("Error fetching years:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch years" },
      { status: 500 }
    );
  }
}