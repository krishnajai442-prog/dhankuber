import type { Metadata } from "next";
import { MarketChartClient } from "@/components/home/MarketChartClient";
import { MONTH_NAMES, istNow, istToday, titleFromSlug } from "@/lib/markets";
import { BRAND_NAME, BRAND_KEYWORDS } from "@/lib/brand";

type Props = { params: { market: string } };

export function generateMetadata({ params }: Props): Metadata {
  const name = titleFromSlug(params.market);
  const t = istToday(istNow());
  const month = MONTH_NAMES[t.month - 1];
  const title = `${name} Satta Result Chart ${month} ${t.year}`;
  const description =
    `${name} daily satta result and monthly record chart for ${month} ${t.year} on ${BRAND_NAME} ` +
    `(onlinekhiwal), with Gali, Desawar, Faridabad, Haruf King and Ghaziabad combined charts.`;
  const url = `/${params.market}/satta-result-chart/`;

  return {
    title,
    description,
    keywords: [
      `${name} result`, `${name} satta result`, `${name} chart`,
      `${name} record chart`, `${name} ${month} ${t.year}`,
      ...BRAND_KEYWORDS,
    ],
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: BRAND_NAME },
  };
}

export default function MarketChartPage({ params }: Props) {
  return <MarketChartClient slug={params.market} />;
}