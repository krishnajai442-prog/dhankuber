/**
 * ONE-OFF: deletes every chart whose market is NOT in the keep-list.
 * Keeps: Tirunelveli Thalapathis, Tiruppur Thalaivas, Trichy Thakurs,
 *        Udaipur Udayans, Ujjain Ujjwals + Gali, Desawar, Faridabad, Ghaziabad.
 * Run AFTER updating DEFAULT_MARKETS in markets.ts.
 * Target production by setting MONGODB_URI in the shell first.
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { escapeRegExp } from "@/lib/markets";

const KEEP = [
  "Tirunelveli Thalapathis",
  "Tiruppur Thalaivas",
  "Trichy Thakurs",
  "Udaipur Udayans",
  "Ujjain Ujjwals",
  "Gali",
  "Desawar",
  "Faridabad",
  "Ghaziabad",
];

async function main() {
  await connectDB();
  console.log(`Connected → host: ${mongoose.connection.host} | database: ${mongoose.connection.name}`);

  // Case-insensitive exact-match whitelist (protects "gali"/"GALI" variants too).
  const keepRegexes = KEEP.map((n) => new RegExp(`^\\s*${escapeRegExp(n)}\\s*$`, "i"));

  const before = await Chart.countDocuments();
  const res = await Chart.deleteMany({ chartName: { $not: { $in: keepRegexes } } });
  const after = await Chart.countDocuments();

  console.log(`🗑️  Deleted ${res.deletedCount} entries (before: ${before}, after: ${after})`);
  console.log("Remaining markets:", await Chart.distinct("chartName"));
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});