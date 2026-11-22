// src/app/api/admin/me/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { verifyToken, hashPassword, verifyPassword } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

    await connectDB();
    const admin = await Admin.findById(payload.id).select("-passwordHash").lean();
    if (!admin || !admin.isActive) return NextResponse.json({ success: false, message: "Admin not found" }, { status: 401 });

    return NextResponse.json({
      success: true,
      data: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Authentication failed" }, { status: 500 });
  }
}

// NEW: Change Password Endpoint
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: "Both current and new passwords are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "New password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();
    // Must select +passwordHash to verify it
    const admin = await Admin.findById(payload.id).select("+passwordHash");
    if (!admin) return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });

    const isValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 401 });
    }

    admin.passwordHash = await hashPassword(newPassword);
    await admin.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ success: false, message: "Failed to update password" }, { status: 500 });
  }
}