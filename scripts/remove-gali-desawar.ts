import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";

async function main() {
  try {
    await connectDB();
    const res = await Chart.deleteMany({
      chartName: { $in: [/^\s*gali\s*$/i, /^\s*desawar\s*$/i] },
    });
    console.log("Deleted Gali/Desawar chart documents:", res.deletedCount);
    process.exit(0);
  } catch (error) {
    console.error("Removal failed:", error);
    process.exit(1);
  }
}
main();