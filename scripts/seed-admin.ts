import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const email = process.env.ADMIN_EMAIL || `${username}@localhost`;
  try {
    await connectDB();
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      // Plain password here — the model's pre-save hook hashes it exactly once
      existingAdmin.passwordHash = password;
      existingAdmin.isActive = true;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = undefined;
      await existingAdmin.save();
      console.log(`Admin "${username}" password reset from .env.local successfully`);
      process.exit(0);
    }
    const admin = await Admin.create({
      username,
      email,
      passwordHash: password,
      role: "super_admin",
      isActive: true,
    });
    console.log("Admin user created successfully:", {
      id: (admin._id as mongoose.Types.ObjectId).toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}
seedAdmin();