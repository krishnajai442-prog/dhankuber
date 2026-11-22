"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { chartSchema, chartUpdateSchema, chartFilterSchema } from "@/lib/validations";
import { requireAuth, requireRole } from "@/lib/auth";

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedCharts {
  charts: Array<{
    id: string;
    chartName: string;
    result: string;
    openingResult?: string;
    closingResult?: string;
    date: number;
    month: number;
    year: number;
    displayOrder: number;
    isHighlighted: boolean;
    isActive: boolean;
    formattedDate: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function createChartAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["super_admin", "admin", "editor"]);

  const validation = chartSchema.safeParse({
    chartName: formData.get("chartName"),
    result: formData.get("result"),
    openingResult: formData.get("openingResult") || undefined,
    closingResult: formData.get("closingResult") || undefined,
    date: formData.get("date"),
    month: formData.get("month"),
    year: formData.get("year"),
    displayOrder: formData.get("displayOrder"),
    isHighlighted: formData.get("isHighlighted") === "true",
    isActive: formData.get("isActive") === "true",
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  await connectDB();

  const existing = await Chart.findOne({
    chartName: validation.data.chartName,
    date: validation.data.date,
    month: validation.data.month,
    year: validation.data.year,
  });

  if (existing) {
    return {
      success: false,
      message: "A chart with this name and date already exists",
    };
  }

  const chart = await Chart.create(validation.data);

  revalidatePath("/");
  revalidatePath("/admin/charts");

  return {
    success: true,
    message: "Chart created successfully",
    data: {
      id: (chart._id as mongoose.Types.ObjectId).toString(),
      ...chart.toObject(),
    },
  };
}

export async function updateChartAction(chartId: string, formData: FormData): Promise<ActionResult> {
  await requireRole(["super_admin", "admin", "editor"]);

  const validation = chartUpdateSchema.safeParse({
    chartName: formData.get("chartName"),
    result: formData.get("result"),
    openingResult: formData.get("openingResult") || undefined,
    closingResult: formData.get("closingResult") || undefined,
    date: formData.get("date"),
    month: formData.get("month"),
    year: formData.get("year"),
    displayOrder: formData.get("displayOrder"),
    isHighlighted: formData.get("isHighlighted") === "true",
    isActive: formData.get("isActive") === "true",
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  await connectDB();

  const chart = await Chart.findById(chartId);
  if (!chart) {
    return { success: false, message: "Chart not found" };
  }

  if (validation.data.chartName || validation.data.date || validation.data.month || validation.data.year) {
    const checkName = validation.data.chartName || chart.chartName;
    const checkDate = validation.data.date || chart.date;
    const checkMonth = validation.data.month || chart.month;
    const checkYear = validation.data.year || chart.year;

    const existing = await Chart.findOne({
      _id: { $ne: chartId },
      chartName: checkName,
      date: checkDate,
      month: checkMonth,
      year: checkYear,
    });

    if (existing) {
      return {
        success: false,
        message: "A chart with this name and date already exists",
      };
    }
  }

  Object.assign(chart, validation.data);
  await chart.save();

  revalidatePath("/");
  revalidatePath("/admin/charts");

  return {
    success: true,
    message: "Chart updated successfully",
    data: chart.toObject(),
  };
}

export async function deleteChartAction(chartId: string): Promise<ActionResult> {
  await requireRole(["super_admin", "admin"]);

  await connectDB();

  const chart = await Chart.findByIdAndDelete(chartId);
  if (!chart) {
    return { success: false, message: "Chart not found" };
  }

  revalidatePath("/");
  revalidatePath("/admin/charts");

  return { success: true, message: "Chart deleted successfully" };
}

export async function getChartsAction(filters: Record<string, unknown>): Promise<ActionResult<PaginatedCharts>> {
  await requireAuth();

  const validation = chartFilterSchema.safeParse(filters);

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid filters",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  await connectDB();

  const { search, date, month, year, isActive, page, limit, sortBy, sortOrder } = validation.data;

  const query: Record<string, unknown> = {};

  if (search) {
    query.chartName = { $regex: search, $options: "i" };
  }
  if (date) query.date = date;
  if (month) query.month = month;
  if (year) query.year = year;
  if (isActive && isActive !== "all") query.isActive = isActive === "true";

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [charts, total] = await Promise.all([
    Chart.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Chart.countDocuments(query),
  ]);

  return {
    success: true,
    message: "Charts fetched",
    data: {
      charts: charts.map((c) => ({
        id: c._id.toString(),
        chartName: c.chartName,
        result: c.result,
        openingResult: c.openingResult,
        closingResult: c.closingResult,
        date: c.date,
        month: c.month,
        year: c.year,
        displayOrder: c.displayOrder,
        isHighlighted: c.isHighlighted,
        isActive: c.isActive,
        formattedDate: c.formattedDate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

export async function getChartByIdAction(chartId: string): Promise<ActionResult> {
  await requireAuth();

  await connectDB();

  const chart = await Chart.findById(chartId).lean();
  if (!chart) {
    return { success: false, message: "Chart not found" };
  }

  return {
    success: true,
    message: "Chart fetched",
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
      formattedDate: chart.formattedDate,
      createdAt: chart.createdAt,
      updatedAt: chart.updatedAt,
    },
  };
}

export async function getPublicChartsAction(params: {
  year?: number;
  month?: number;
  date?: number;
  chartName?: string;
}): Promise<ActionResult> {
  await connectDB();

  const query: Record<string, unknown> = { isActive: true };

  if (params.year) query.year = params.year;
  if (params.month) query.month = params.month;
  if (params.date) query.date = params.date;
  if (params.chartName) query.chartName = params.chartName;

  const charts = await Chart.find(query)
    .sort({ displayOrder: 1, chartName: 1 })
    .lean();

  return {
    success: true,
    message: "Charts fetched",
    data: charts.map((c) => ({
      id: c._id.toString(),
      chartName: c.chartName,
      result: c.result,
      openingResult: c.openingResult,
      closingResult: c.closingResult,
      date: c.date,
      month: c.month,
      year: c.year,
      displayOrder: c.displayOrder,
      isHighlighted: c.isHighlighted,
      isActive: c.isActive,
      formattedDate: c.formattedDate,
    })),
  };
}

export async function getAvailableYearsAction(): Promise<ActionResult<number[]>> {
  await connectDB();

  const years = await Chart.distinct("year").sort();
  const currentYear = new Date().getFullYear();
  const allYears = Array.from(new Set([...years, currentYear, currentYear + 1, currentYear + 2])).sort((a, b) => b - a);

  return {
    success: true,
    message: "Years fetched",
    data: allYears,
  };
}

export async function getAvailableMonthsAction(year: number): Promise<ActionResult<number[]>> {
  await connectDB();

  const months = await Chart.distinct("month", { year }).sort();
  return {
    success: true,
    message: "Months fetched",
    data: months,
  };
}

export async function getAvailableDatesAction(year: number, month: number): Promise<ActionResult<number[]>> {
  await connectDB();

  const dates = await Chart.distinct("date", { year, month }).sort();
  return {
    success: true,
    message: "Dates fetched",
    data: dates,
  };
}

export async function getDashboardStatsAction(): Promise<ActionResult> {
  await requireAuth();

  await connectDB();

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();
    const [totalCharts, totalResults, todaysEntries, latestCharts] = await Promise.all([
      // Total Charts → today's tables only (matches the Charts page default view)
      Chart.countDocuments({ date: d, month: m, year: y }),
      // Active Results → today's tables that are Active
      Chart.countDocuments({ date: d, month: m, year: y, isActive: true }),
      // Today's Entries → today's tables added/edited today (never > Total Charts)
      Chart.countDocuments({
        date: d,
        month: m,
        year: y,
        $or: [
          { createdAt: { $gte: todayStart, $lt: todayEnd } },
          { updatedAt: { $gte: todayStart, $lt: todayEnd } },
        ],
      }),
      Chart.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);

  return {
    success: true,
    message: "Stats fetched",
    data: {
      totalCharts,
      totalResults,
      todaysEntries,
      latestCharts: latestCharts.map((c) => ({
        id: c._id.toString(),
        chartName: c.chartName,
        result: c.result,
        date: c.date,
        month: c.month,
        year: c.year,
        createdAt: c.createdAt,
      })),
    },
  };
}

export async function toggleHighlightAction(chartId: string): Promise<ActionResult> {
  await requireRole(["super_admin", "admin", "editor"]);

  await connectDB();

  const chart = await Chart.findById(chartId);
  if (!chart) {
    return { success: false, message: "Chart not found" };
  }

  chart.isHighlighted = !chart.isHighlighted;
  await chart.save();

  revalidatePath("/");
  revalidatePath("/admin/charts");

  return {
    success: true,
    message: `Chart ${chart.isHighlighted ? "highlighted" : "unhighlighted"}`,
    data: { isHighlighted: chart.isHighlighted },
  };
}

export async function toggleActiveAction(chartId: string): Promise<ActionResult> {
  await requireRole(["super_admin", "admin", "editor"]);

  await connectDB();

  const chart = await Chart.findById(chartId);
  if (!chart) {
    return { success: false, message: "Chart not found" };
  }

  chart.isActive = !chart.isActive;
  await chart.save();

  revalidatePath("/");
  revalidatePath("/admin/charts");

  return {
    success: true,
    message: `Chart ${chart.isActive ? "activated" : "deactivated"}`,
    data: { isActive: chart.isActive },
  };
}