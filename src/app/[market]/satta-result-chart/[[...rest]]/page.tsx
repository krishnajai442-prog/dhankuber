import type { Metadata } from "next";
import { MarketChartClient } from "@/components/home/MarketChartClient";
import { MONTH_NAMES, istNow, istToday, titleFromSlug } from "@/lib/markets";

type Props = { params: { market: string } };

/** Unique SEO title/description per market — the whole point of the split. */
export function generateMetadata({ params }: Props): Metadata {
  const name = titleFromSlug(params.market);
  const t = istToday(istNow());
  const month = MONTH_NAMES[t.month - 1];
  const title = `${name} Satta Result Chart ${month} ${t.year}`;
  const description = `${name} daily satta result and monthly record chart for ${month} ${t.year}, with Gali, Desawar, Faridabad and Ghaziabad combined charts on Dhan Kuber.`;
  const url = `/${params.market}/satta-result-chart/`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default function MarketChartPage({ params }: Props) {
  return <MarketChartClient slug={params.market} />;
}