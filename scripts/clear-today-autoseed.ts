/** One-off: blank today's rows that still hold the auto-seeded placeholder. */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { autoResult, istNow, istToday, slugify } from "@/lib/markets";

async function main() {
  await connectDB();
  const t = istToday(istNow());
  const rows = await Chart.find({ date: t.day, month: t.month, year: t.year });
  let cleared = 0;
  for (const r of rows) {
    if (r.result && r.result === autoResult(slugify(r.chartName), t.day, t.month, t.year)) {
      r.result = "";
      await r.save();
      cleared++;
    }
  }
  console.log(`Cleared ${cleared} auto-seeded placeholder(s) for ${t.day}/${t.month}/${t.year}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });