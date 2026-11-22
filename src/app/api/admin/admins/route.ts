// src/app/api/admin/admins/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !["super_admin", "admin"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    // -passwordHash ensures the encrypted password is NEVER sent to the frontend
    const admins = await Admin.find().select("-passwordHash").sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: admins.map((a) => ({
        id: a._id.toString(),
        username: a.username,
        email: a.email,
        role: a.role,
        isActive: a.isActive,
        lastLoginAt: a.lastLoginAt,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch admins" }, { status: 500 });
  }
}