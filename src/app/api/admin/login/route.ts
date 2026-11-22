export const dynamic = "force-dynamic";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { verifyPassword, createToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const username = validation.data.username;
    const password = validation.data.password;

    // Credentials from .env.local — the single source of truth for the owner account
    const envUser = process.env.ADMIN_USERNAME || "admin";
    const envPass = process.env.ADMIN_PASSWORD || "admin123";

    let admin = await Admin.findOne({
      $or: [{ username }, { email: username }],
    }).select("+passwordHash");

    // ENV FALLBACK + SELF-HEAL:
    // If the entered credentials match .env.local, make sure the DB account exists
    // and its hash is correct (fixes broken / double-hashed passwords automatically).
    if (username === envUser && password === envPass) {
      if (!admin) {
        // Create the owner account (model pre-save hook hashes the plain password)
        admin = await Admin.create({
          username: envUser,
          email: process.env.ADMIN_EMAIL || `${envUser}@localhost`,
          passwordHash: envPass,
          role: "super_admin",
          isActive: true,
        });
      } else if (!(await verifyPassword(envPass, admin.passwordHash))) {
        // Stored hash is broken/double-hashed → repair it from the env password
        admin.passwordHash = envPass; // pre-save hook re-hashes once → correct hash
        admin.isActive = true;
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        await admin.save();
      }
    }

    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }
    if (!admin.isActive) {
      return NextResponse.json({ success: false, message: "Account is deactivated. Contact administrator." }, { status: 401 });
    }
    if (admin.isLocked) {
      return NextResponse.json(
        { success: false, message: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      await admin.incrementLoginAttempts();
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
    }

    await admin.resetLoginAttempts();
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = await createToken({
      id: (admin._id as mongoose.Types.ObjectId).toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: { redirect: "/admin/dashboard" },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500 });
  }
}