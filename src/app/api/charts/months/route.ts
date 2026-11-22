export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json(
        { success: false, message: "Year parameter is required" },
        { status: 400 }
      );
    }

    // Return all 12 months (1-12) regardless of data availability
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return NextResponse.json({
      success: true,
      data: months,
    });
  } catch (error) {
    console.error("Error fetching months:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch months" },
      { status: 500 }
    );
  }
}