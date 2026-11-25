import type { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import Chart from "@/models/Chart";
import { slugify } from "@/lib/markets";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://dhankuber-ruddy.vercel.app";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = ["", "/contact-form", "/terms", "/privacy", "/disclaimer"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.4,
  }));

  try {
    await connectDB();
    const names = (await Chart.distinct("chartName")) as string[];
    const markets: MetadataRoute.Sitemap = names.map((n) => ({
      url: `${BASE}/${slugify(n)}/satta-result-chart/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));
    return [...statics, ...markets];
  } catch {
    return statics;
  }
}