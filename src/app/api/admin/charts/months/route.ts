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