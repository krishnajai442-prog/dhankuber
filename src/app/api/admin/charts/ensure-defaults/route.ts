export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { verifyToken } from "@/lib/auth";
import {
  DEFAULT_MARKETS, SPECIAL_MARKETS, addDays, autoResult, escapeRegExp, getDefaultDrawTime, istNow, istToday, slugify,
} from "@/lib/markets";

/**
 * Creates DB entries for the 4 default markets (Gali, Desawar, Faridabad, Ghaziabad)
 * for yesterday + today when they don't exist yet, using the exact same auto values,
 * draw times and highlight the public site shows by default.
 * Idempotent — running it again never duplicates (unique index also protects).
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !["super_admin", "admin", "editor"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const today = istToday(istNow());
    const yesterday = addDays(today, -1);
    let created = 0;

    for (const day of [yesterday, today]) {
          for (const name of [...DEFAULT_MARKETS, ...SPECIAL_MARKETS]) {
        const slug = slugify(name);
               const existing = await Chart.findOne({
          chartName: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
          date: day.day,
          month: day.month,
          year: day.year,
        });
        if (existing) {
          // Migrate rows that were seeded with the old 12:00 fallback to the real schedule
           const def = getDefaultDrawTime(slug);
          // Only fill when no time was ever set — an admin choice (even 12:00) is sacred.
          if (!existing.drawTime && def) {
            existing.drawTime = def;
            await existing.save();
          }
          continue;
        }

        await Chart.create({
          chartName: name,
          result: autoResult(slug, day.day, day.month, day.year),
          date: day.day,
          month: day.month,
          year: day.year,
          displayOrder: 0,
          isHighlighted: false, // highlight is decided only by the admin
          isActive: true,
          drawTime: getDefaultDrawTime(slug),
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: created > 0 ? `Synced default markets (${created} new entries)` : "Default markets already synced",
      data: { created },
    });
  } catch (error) {
    console.error("Ensure defaults error:", error);
    return NextResponse.json({ success: false, message: "Failed to sync default markets" }, { status: 500 });
  }
}