/**
 * Reset an admin password directly in MongoDB.
 * Usage: npm run reset:admin -- <username> <newPassword>
 * Target a specific DB by setting MONGODB_URI in the shell first
 * (dotenv never overrides an env var that is already set).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function main() {
  const uri = process.env.MONGODB_URI;
  const username = (process.argv[2] || "admin").trim();
  const newPassword = process.argv[3];

  if (!uri) {
    console.error("❌ MONGODB_URI is not set.");
    process.exit(1);
  }
  if (!newPassword || newPassword.length < 8) {
    console.error("Usage: npm run reset:admin -- <username> <newPassword  (8+ characters)>");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected → host: ${mongoose.connection.host} | database: ${mongoose.connection.name}`);

  const db = mongoose.connection.db!;
  const admins = db.collection("admins");
  const existing = await admins.findOne({ username });

  if (!existing) {
    const list = await admins.find({}, { projection: { username: 1, role: 1 } }).toArray();
    console.error(`❌ No admin named "${username}" in this database.`);
    console.error("   Admins present:", list.map((a) => a.username));
    console.error("   Collections:", (await db.listCollections().toArray()).map((c) => c.name));
    await mongoose.disconnect();
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  const res = await admins.updateOne(
    { _id: existing._id },
    { $set: { password: hash, isActive: true, updatedAt: new Date() } }
  );

  console.log(`✅ Password reset for "${username}" — matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  console.log("   Log in on the site that uses THIS database, then change it again in Settings if you like.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Reset failed:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});