export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";

export async function GET() {
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

    const years = await Chart.distinct("year").sort();
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