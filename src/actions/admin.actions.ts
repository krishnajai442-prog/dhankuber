"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { hashPassword, verifyPassword, createToken, verifyToken, clearSession, ROLES } from "@/lib/auth";
import { loginSchema, adminSchema, updateAdminSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export interface AdminData {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

async function rateLimitCheck(identifier: string): Promise<boolean> {
  const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "5");
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000");

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  if (typeof globalThis !== "undefined") {
    const store = (globalThis as { ratelimit?: Map<string, { count: number; resetAt: number }> }).ratelimit || new Map();
    (globalThis as { ratelimit?: Map<string, { count: number; resetAt: number }> }).ratelimit = store;

    const record = store.get(key);

    if (!record || record.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count += 1;
    return true;
  }

  return true;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const identifier = `login:${formData.get("username")}`;

  if (!(await rateLimitCheck(identifier))) {
    return {
      success: false,
      message: "Too many login attempts. Please try again later.",
    };
  }

  const validation = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  await connectDB();

  const admin = await Admin.findOne({
    $or: [{ username: validation.data.username }, { email: validation.data.username }],
  }).select("+passwordHash");

  if (!admin) {
    return {
      success: false,
      message: "Invalid username or password",
    };
  }

  if (!admin.isActive) {
    return {
      success: false,
      message: "Account is deactivated. Contact administrator.",
    };
  }

  if (admin.isLocked) {
    return {
      success: false,
      message: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
    };
  }

  const isValid = await verifyPassword(validation.data.password, admin.passwordHash);

  if (!isValid) {
    await admin.incrementLoginAttempts();
    return {
      success: false,
      message: "Invalid username or password",
    };
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

  return {
    success: true,
    message: "Login successful",
    data: { redirect: "/admin/dashboard" },
  };
}

export async function logoutAction(): Promise<ActionResult> {
  await clearSession();
  redirect("/admin/login");
}

export async function getCurrentAdmin(): Promise<ActionResult<AdminData>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return { success: false, message: "Invalid session" };
  }

  await connectDB();
  const admin = await Admin.findById(payload.id).select("-passwordHash").lean();

  if (!admin || !admin.isActive) {
    return { success: false, message: "Admin not found or inactive" };
  }

  return {
    success: true,
    message: "Admin found",
    data: {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    },
  };
}

export async function createAdminAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentAdmin();
  if (!session.success || !["super_admin"].includes(session.data?.role || "")) {
    return { success: false, message: "Unauthorized" };
  }

  const validation = adminSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  await connectDB();

  const existing = await Admin.findOne({
    $or: [{ username: validation.data.username }, { email: validation.data.email }],
  });

  if (existing) {
    return {
      success: false,
      message: "Username or email already exists",
    };
  }

  const passwordHash = await hashPassword(validation.data.password);

  const admin = await Admin.create({
    ...validation.data,
    passwordHash,
  });

  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Admin created successfully",
    data: {
      id: (admin._id as mongoose.Types.ObjectId).toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
  };
}

export async function updateAdminAction(adminId: string, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentAdmin();
  if (!session.success || !["super_admin"].includes(session.data?.role || "")) {
    return { success: false, message: "Unauthorized" };
  }

  const validation = updateAdminSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
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

  const admin = await Admin.findById(adminId);
  if (!admin) {
    return { success: false, message: "Admin not found" };
  }

  if ((admin._id as mongoose.Types.ObjectId).toString() === session.data?.id && validation.data.isActive === false) {
    return { success: false, message: "Cannot deactivate your own account" };
  }

  const updateData: Record<string, unknown> = {};

  if (validation.data.username) updateData.username = validation.data.username;
  if (validation.data.email) updateData.email = validation.data.email;
  if (validation.data.role) updateData.role = validation.data.role;
  if (typeof validation.data.isActive === "boolean") updateData.isActive = validation.data.isActive;

  if (validation.data.password) {
    updateData.passwordHash = await hashPassword(validation.data.password);
  }

  const updated = await Admin.findByIdAndUpdate(adminId, updateData, { new: true }).select("-passwordHash");

  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Admin updated successfully",
    data: updated,
  };
}

export async function deleteAdminAction(adminId: string): Promise<ActionResult> {
  const session = await getCurrentAdmin();
  if (!session.success || !["super_admin"].includes(session.data?.role || "")) {
    return { success: false, message: "Unauthorized" };
  }

  if (adminId === session.data?.id) {
    return { success: false, message: "Cannot delete your own account" };
  }

  await connectDB();

  const admin = await Admin.findByIdAndDelete(adminId);
  if (!admin) {
    return { success: false, message: "Admin not found" };
  }

  revalidatePath("/admin/dashboard");

  return { success: true, message: "Admin deleted successfully" };
}

export async function getAdminsAction(): Promise<ActionResult> {
  const session = await getCurrentAdmin();
  if (!session.success || !["super_admin", "admin"].includes(session.data?.role || "")) {
    return { success: false, message: "Unauthorized" };
  }

  await connectDB();

  const admins = await Admin.find().select("-passwordHash").sort({ createdAt: -1 }).lean();

  return {
    success: true,
    message: "Admins fetched",
    data: admins.map((a) => ({
      id: a._id.toString(),
      username: a.username,
      email: a.email,
      role: a.role,
      isActive: a.isActive,
      lastLoginAt: a.lastLoginAt,
      createdAt: a.createdAt,
    })),
  };
}