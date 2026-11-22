import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Chart from "@/models/Chart";

async function pushDB() {
  try {
    await connectDB();

    // Create indexes - handle conflicts gracefully
    try {
      await Admin.syncIndexes();
    } catch (e: any) {
      if (e.code === 86 || e.codeName === "IndexKeySpecsConflict") {
        console.log("Admin indexes already exist (conflict handled)");
      } else {
        throw e;
      }
    }
    
    try {
      await Chart.syncIndexes();
    } catch (e: any) {
      if (e.code === 86 || e.codeName === "IndexKeySpecsConflict") {
        console.log("Chart indexes already exist (conflict handled)");
      } else {
        throw e;
      }
    }

    console.log("Database indexes created/verified successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error pushing database:", error);
    process.exit(1);
  }
}

pushDB();