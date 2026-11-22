export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import { chartUpdateSchema } from "@/lib/validations";
import { canonicalMarketName, escapeRegExp } from "@/lib/markets";

/** .lean() queries skip Mongoose virtuals → build formattedDate manually. */
function formatChartDate(date: number, month: number, year: number): string {
  return `${String(date).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !["super_admin", "admin", "editor"].includes(payload.role)) return null;

  return payload;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await checkAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const chart = await Chart.findById(id).lean();
    if (!chart) {
      return NextResponse.json({ success: false, message: "Chart not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: chart._id.toString(),
        chartName: chart.chartName,
        result: chart.result,
        openingResult: chart.openingResult,
        closingResult: chart.closingResult,
        date: chart.date,
        month: chart.month,
        year: chart.year,
        displayOrder: chart.displayOrder,
        isHighlighted: chart.isHighlighted,
        isActive: chart.isActive,
        scheduledAt: chart.scheduledAt,
        drawTime: chart.drawTime,
        formattedDate: formatChartDate(chart.date, chart.month, chart.year),
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching chart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch chart" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await checkAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = chartUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;
    const chart = await Chart.findById(id);
    if (!chart) {
      return NextResponse.json({ success: false, message: "Chart not found" }, { status: 404 });
    }

    // Duplicate check only when name/date fields are being changed
        if (validation.data.chartName) {
      validation.data.chartName = canonicalMarketName(validation.data.chartName);
    }

    if (validation.data.chartName || validation.data.date || validation.data.month || validation.data.year) {
      const checkName = validation.data.chartName || chart.chartName;
      const checkDate = validation.data.date || chart.date;
      const checkMonth = validation.data.month || chart.month;
      const checkYear = validation.data.year || chart.year;

      const existing = await Chart.findOne({
        _id: { $ne: id },
        chartName: { $regex: `^${escapeRegExp(checkName)}$`, $options: "i" },
        date: checkDate,
        month: checkMonth,
        year: checkYear,
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "A chart with this name and date already exists (case-insensitive)" },
          { status: 409 }
        );
      }
    }

       // Updating a result always publishes the table → it falls under Active Results
    if (validation.data.result && validation.data.result !== chart.result) {
      chart.isActive = true;
    }
    Object.assign(chart, validation.data); // includes drawTime
    await chart.save();
    return NextResponse.json({
      success: true,
      message: "Chart updated successfully",
      data: chart.toObject(),
    });
  } catch (error) {
    console.error("Error updating chart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update chart" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await checkAuth();
    // Deleting is restricted to super_admin / admin (editors cannot delete)
    if (!payload || !["super_admin", "admin"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const chart = await Chart.findByIdAndDelete(id);
    if (!chart) {
      return NextResponse.json({ success: false, message: "Chart not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Chart deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete chart" },
      { status: 500 }
    );
  }
}