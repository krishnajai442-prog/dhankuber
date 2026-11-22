import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { DEFAULT_MARKETS } from "@/lib/markets";

/** One-off: remove the auto-seeded highlights so nothing is yellow unless the admin set it. */
async function main() {
  try {
    await connectDB();
    const res = await Chart.updateMany(
      { chartName: { $in: DEFAULT_MARKETS }, isHighlighted: true },
      { $set: { isHighlighted: false } }
    );
    console.log("Un-highlighted seeded default rows:", res.modifiedCount);
    process.exit(0);
  } catch (error) {
    console.error("Un-highlight failed:", error);
    process.exit(1);
  }
}
main();