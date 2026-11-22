import Link from "next/link";

export interface LiveRow {
  slug: string;
  name: string;
  timeLabel: string;
  yesterday: string;
  today: string;
  highlighted: boolean;
}

export interface LiveSection {
  label: string; // "LIVE" | "NEXT" | "REST"
  rows: LiveRow[];
}

interface LiveResultsTableProps {
  banner: string;
  col1: string;
  col2: string;
  rows?: LiveRow[];
  sections?: LiveSection[];
  showLive?: boolean;
  showFooter?: boolean;
}

function LiveDot() {
  return (
    <span className="relative flex h-3 w-3" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f0435f] opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-[#f0435f]" />
    </span>
  );
}

function SectionHeader({ label, withDot = false }: { label: string; withDot?: boolean }) {
  return (
    <tr className="bg-[#e9e9e9]">
      <td colSpan={3} className="border-l-4 border-[#f0435f] px-4 py-2">
        <span className="inline-flex items-center gap-2 font-bold tracking-wide text-[#f0435f]">
          {withDot && <LiveDot />}
          {label}
        </span>
      </td>
    </tr>
  );
}

function BodyRows({ rows }: { rows: LiveRow[] }) {
  return (
    <>
      {rows.map((r, i) => (
        <tr key={r.slug} className={r.highlighted ? "bg-[#f2c900]" : i % 2 === 1 ? "bg-[#f4f6fa]" : "bg-white"}>
          <td className="border-b border-gray-200 px-4 py-2">
            <p className="text-lg font-medium uppercase text-gray-900">{r.name}</p>
            <p className="mt-0.5 text-xs text-gray-700">
              at {r.timeLabel}
              <Link href={`/${r.slug}/satta-result-chart/`} className="ml-2 text-sm text-blue-600 hover:underline">
                Record Chart
              </Link>
            </p>
          </td>
          <td className="border-b border-gray-200 px-2 py-2 text-center text-2xl font-bold text-gray-900">{r.yesterday}</td>
          <td className="border-b border-gray-200 px-2 py-2 text-center text-2xl font-bold text-gray-900">{r.today}</td>
        </tr>
      ))}
    </>
  );
}

export function LiveResultsTable({
  banner, col1, col2, rows = [], sections, showLive = true, showFooter = false,
}: LiveResultsTableProps) {
  const useSections = !!sections && sections.length > 0;
  return (
    <div className="w-full">
      <div className="bg-[#3ed99c] px-4 py-4 text-center text-lg font-semibold text-white sm:text-xl">{banner}</div>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="bg-[#3d3d3d] text-white">
            <th className="w-[60%] px-4 py-3 text-left font-semibold">Regional Offline Draw Results</th>
            <th className="w-[20%] px-2 py-3 text-center font-semibold">{col1}</th>
            <th className="w-[20%] px-2 py-3 text-center font-semibold">{col2}</th>
          </tr>
          {!useSections && showLive && <SectionHeader label="LIVE" withDot />}
        </thead>
        <tbody>
          {useSections ? (
            sections!.map((s) => (
              <FragmentSection key={s.label} section={s} />
            ))
          ) : (
            <BodyRows rows={rows} />
          )}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr className="bg-[#f2c900]">
              <td colSpan={3} className="px-4 py-4 text-center">
                <p className="text-lg font-bold text-[#d81b60]">
                  <span aria-hidden="true">♛</span> SHOW YOUR GAME HERE <span aria-hidden="true">♛</span>
                </p>
                <Link href="/contact-form" className="text-sm font-semibold text-blue-700 hover:underline">
                  Contact us to show your game here
                </Link>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function FragmentSection({ section }: { section: LiveSection }) {
  return (
    <>
      <SectionHeader label={section.label} withDot={section.label === "LIVE"} />
      {section.rows.length === 0 && section.label === "LIVE" ? (
        <tr className="bg-white">
          <td colSpan={3} className="border-b border-gray-200 px-4 py-3 text-sm text-gray-500">
            Waiting for today&apos;s first result…
          </td>
        </tr>
      ) : (
        <BodyRows rows={section.rows} />
      )}
    </>
  );
}