// Shared helpers: market schedule, slugs, IST dates, auto results, monthly chart builder,
// case-insensitive market identity, and resilient cached fetching.

/* ------------------------------- constants ------------------------------- */

/** The 4 permanent "special" tables (monthly chart columns; admin may backfill past dates). */
export const SPECIAL_MARKETS = ["Gali", "Desawar", "Faridabad", "Haruf King", "Ghaziabad"];
/** Slug mirrors of SPECIAL_MARKETS — keep both lists in sync. */
export const SPECIAL_SLUGS = ["gali", "desawar", "faridabad", "haruf-king", "ghaziabad"];

/** Markets that declare a 3-digit number instead of the usual 2. */
export const THREE_DIGIT_SLUGS = ["haruf-king"];
/** Digit count for a market's number: Haruf King → 3, everything else → 2. */
export function resultDigits(slug: string): number {
  return THREE_DIGIT_SLUGS.includes(slug) ? 3 : 2;
}

export const teamNames: string[] = [
  "Gali Gharana", "Desawar Dabangs", "Faridabad Fauj", "Ghaziabad Gurkhas", "Delhi Dilwale", "Mumbai Maharajas", "Kolkata Kohinoors", "Chennai Chakravartis",
  "Bangalore Bahubalis", "Hyderabad Hanumans", "Pune Peshwas", "Ahmedabad Ashokas", "Jaipur Jantars", "Lucknow Lavas", "Kanpur Kesaris", "Nagpur Nagas",
  "Indore Indras", "Bhopal Bahadurs", "Vizag Veers", "Patna Pahalwans", "Vadodara Vajras", "Ludhiana Lakshmans", "Agra Aadityas", "Nashik Nandis",
  "Meerut Mauryas", "Rajkot Rajputs", "Kalyan Kavachs", "Vasai Vanars", "Varanasi Vairagis", "Srinagar Shikaras", "Aurangabad Ajantas", "Dhanbad Dhurandhars",
  "Amritsar Angaarey", "Navi Mumbai Navratnas", "Allahabad Agnis", "Howrah Haris", "Gwalior Garudas", "Jabalpur Jyotis", "Coimbatore Cholas",
  "Vijayawada Vikrams", "Jodhpur Jaswants", "Madurai Maharanis", "Raipur Rajas", "Kota Khiladis", "Guwahati Gajraj", "Chandigarh Chhatrapatis", "Solapur Samrats",
  "Hubli Hoysalas", "Mysore Marthandas", "Trichy Thakurs", "Bareilly Bhalas", "Aligarh Angads", "Tiruppur Thalaivas", "Moradabad Maharathis",
  "Jalandhar Jatts", "Bhubaneswar Bhairavs", "Salem Shaktis", "Warangal Vishnus", "Guntur Gopals", "Bhiwandi Bhishmas", "Saharanpur Sardars",
  "Gorakhpur Gurus", "Bikaner Bhatis", "Amravati Arjunas", "Noida Nayaks", "Jamshedpur Jeetwale", "Bhilai Bhimas", "Cuttack Chalukyas",
  "Firozabad Falgunis", "Kochi Kathakalis", "Nellore Natraj", "Bhavnagar Bhagats", "Dehradun Devas", "Durgapur Durgas", "Asansol Ashvins",
  "Rourkela Rudras", "Nanded Narsimhas", "Kolhapur Karnas", "Ajmer Aryas", "Akola Agniveers", "Gulbarga Gadas", "Jamnagar Jamsahebs", "Ujjain Ujjwals",
  "Loni Lakshyas", "Siliguri Shers", "Jhansi Jhalkaris", "Ulhasnagar Utsavs", "Jammu Jawans", "Sangli Shoorveers", "Mangalore Mahaveers", "Erode Eklavyas",
  "Belgaum Brahmos", "Ambattur Avatars", "Tirunelveli Thalapathis", "Malegaon Mavlas", "Gaya Gautams", "Jalgaon Jujhars", "Udaipur Udayans", "Maheshtala Mahadevs",
];

/** The ONLY tables the site keeps: 5 teams + the Special 4 (always present). */
export const DEFAULT_MARKETS: string[] = [
  "Tirunelveli Thalapathis",
  "Tiruppur Thalaivas",
  "Trichy Thakurs",
  "Udaipur Udayans",
  "Ujjain Ujjwals",
];

/** Legacy: highlighting is 100% admin-controlled, so nothing is highlighted by default. */
export const MAJOR_SLUGS: string[] = [];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Legacy grace window (kept for compatibility). */
export const GRACE_MINUTES = 10;
/** Draw time passed but no admin result. */
export const MISSING_MARK = "--";
/** Upcoming draw (time not reached). Set to "❌" if you prefer the emoji. */
export const UPCOMING_MARK = "XX";

/** LIVE = already drawn today; NEXT = upcoming within 6h; REST = later. */
export const NEXT_WINDOW_MINUTES = 360;
export type DrawSection = "LIVE" | "NEXT" | "REST";
export function drawSection(minutes: number, nowMinutes: number): DrawSection {
  if (nowMinutes >= minutes) return "LIVE";
  if (minutes - nowMinutes <= NEXT_WINDOW_MINUTES) return "NEXT";
  return "REST";
}

/* --------------------------- identity / naming --------------------------- */

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export function titleFromSlug(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
/** Case-insensitive identity key: "Sadabahar" === "sadabahar". */
export function marketKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
/** Canonical storage/display form: "sadabahar"/"SADABAHAR" -> "Sadabahar". */
export function canonicalMarketName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}
/** Escape a string for safe use inside a MongoDB $regex. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------- drawing -------------------------------- */

/** Reference schedule exactly as shown on the reference site (24h HH:MM). */
const REFERENCE_DRAW_TIMES: Record<string, string> = {
  "noida-king": "01:15", "bikaner-super": "02:20", desawar: "05:00", "chotta-bazar": "05:30", "new-punjab": "11:10",
  "royal-bazar": "13:15", "gaj-kesri": "13:15", "super-king": "13:45", "matka-sone-ka": "13:55",
  "up-king": "14:00", "agra-bazar": "14:00", "rajdhani-jaipur": "14:00", "janta-city": "14:00",
  "mumbai-bazaar": "14:00", "ujala-super": "14:00", "new-jaipur-king": "14:00",
  "burj-khalifa-bk": "14:10", "shree-ganga-nagar": "14:10", "khatu-darbar": "14:10",
  "matka-king": "14:15", "jd-durga": "14:15", "jaipur-king": "14:20",
  "kalka-bazar": "14:30", savera: "14:30", "super-delhi": "14:30", "delhi-city": "14:30",
  "deep-sagar": "14:40", "delhi-dream": "14:40", "super-taj": "14:40", "meerut-metro": "14:45",
  mohali: "15:00", "delhi-bazar": "15:00", "meerut-city": "15:00", "new-taj": "15:00", "new-delhi-darbar": "15:00",
  chennai: "15:05", "royal-challenge": "15:10", taj: "15:15", "super-bazar": "15:15", "delhi-bazar-day": "15:15",
  anarkali: "15:30", "maa-bhagwati": "15:30", "dubai-delhi": "15:45",
  "udaan-king": "16:00", "shiv-shakti": "16:05", "shri-ganesh": "16:30", "ghaziabad-din": "16:35", "shri-nagar": "16:35",
  "ds-number-1": "17:00", "mahalaxmi-bazar": "17:05", ahmedabad: "17:10", maharaj: "17:15", "uttarakhand-uk": "17:30",
    faridabad: "18:00", "old-faridabad": "18:00", sadabahar: "18:00", "desawar-saam": "18:00", "old-ghaziabad": "18:00",
  "haruf-king": "19:00",
  "punjab-king": "19:15", neelkanth: "19:20",
  "shri-laxmi": "19:30", "old-city": "19:30", "mini-desawer": "19:30", "chotti-ghaziabad": "19:30",
  gurgaon: "19:35", "veera-king": "19:40", paras: "19:40", "farida-bazar": "19:40",
  "delhi-golden": "19:45", "mathura-city": "19:45", "onlinekhiwal": "19:55", "bhavishyavani": "19:55",
  "shri-ji": "20:00", "shiv-shankar": "20:00", bharat: "20:00", nagpur: "20:00", "gali-bazar": "20:00",
  bangalore: "20:00", "punjab-laxmi": "20:00", "magadh-gold": "20:00",
  "vip-agra": "20:05", "mg-prime": "20:05",
  "gali-disawar-mix": "20:15", "maa-lakshmi-delhi": "20:15", "up-bazar": "20:15", hindustan: "20:15",
  "bombay-super": "20:15", "delhi-king": "20:15", "moti-city": "20:15", super: "20:15",
  "shivraj-786": "20:20", "ghaziabad-night": "20:30", "shri-kanak": "20:30", "india-king": "20:30",
  "gold-bazar": "20:35", "faridabad-super": "20:40", mahashiv: "20:45", "gali-gold": "20:45",
  "bhagya-lakshmi": "20:50", "sai-darbar": "21:00", chitra: "21:00", nepal: "21:30",
  "new-ghaziabad": "21:45", ghaziabad: "21:55", "bala-ji-dadri": "22:15", jaisalmer: "22:40",
  "new-gali": "23:00", shalimar: "23:00", "delhi-evening": "23:10", gali: "23:25", "choti-gali": "23:50",
};

/** Shift a whole schedule by N minutes (negative = earlier), wrapping across midnight. */
function shiftTimes(times: Record<string, string>, deltaMinutes: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slug, hhmm] of Object.entries(times)) {
    const [h, m] = hhmm.split(":").map(Number);
    let total = (h * 60 + m + deltaMinutes) % 1440;
    if (total < 0) total += 1440;
    out[slug] = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return out;
}

/** Reference schedule − 30 minutes, for legacy/reference-named markets. */
const DEFAULT_DRAW_TIMES: Record<string, string> = shiftTimes(REFERENCE_DRAW_TIMES, -30);

/** Team tables get the −30 min schedule positionally (alphabetical), preserving groupings. */
const TEAM_SCHEDULE: string[] = [
  "13:30", "13:30", "13:30", "13:30", "13:30", "13:30", "13:30",
  "13:25", "13:15", "12:45", "12:45",
  "13:40", "13:40", "13:40", "13:45", "13:45", "13:50",
  "14:00", "14:00", "14:00", "14:00", "14:10", "14:10", "14:10",
  "14:15", "14:30", "14:30", "14:30", "14:30", "14:30", "14:35",
  "14:40", "14:45", "14:45", "14:45", "15:00", "15:00", "15:15",
  "15:30", "15:35", "16:00", "16:05", "16:05", "16:30", "16:35",
  "16:40", "16:45", "17:00", "17:30", "17:30", "17:30", "17:30", "17:30",
  "18:45", "18:50", "19:00", "19:00", "19:00", "19:00", "19:05",
  "19:10", "19:10", "19:10", "19:15", "19:15", "19:25", "19:25",
  "19:30", "19:30", "19:30", "19:30", "19:30", "19:30", "19:30", "19:30",
  "19:35", "19:35",
  "19:45", "19:45", "19:45", "19:45", "19:45", "19:45", "19:45", "19:45",
  "19:50", "20:00", "20:00", "20:00", "20:05", "20:10",
  "20:15", "20:15", "20:20", "20:30", "20:35",
];

[...DEFAULT_MARKETS]
  .sort((a, b) => a.localeCompare(b))
  .forEach((name, i) => {
    DEFAULT_DRAW_TIMES[slugify(name)] = TEAM_SCHEDULE[i] ?? "12:00";
  });

/** Admin-set time wins; otherwise the market's scheduled default. */
export function getDrawTime(slug: string, dbTime?: string | null): string {
  if (dbTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(dbTime)) return dbTime;
  return DEFAULT_DRAW_TIMES[slug] || "12:00";
}
export function getDefaultDrawTime(slug: string): string {
  return DEFAULT_DRAW_TIMES[slug] || "12:00";
}
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
export function fmtTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
}

/* ------------------------------- IST dates ------------------------------- */

/** Current time in IST (UTC+5:30) regardless of visitor timezone. */
export function istNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}
export interface DayParts { day: number; month: number; year: number; }
export function istToday(now: Date): DayParts {
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}
export function addDays(p: DayParts, delta: number): DayParts {
  const d = new Date(p.year, p.month - 1, p.day + delta);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}
export function weekdayOf(p: DayParts): string {
  return WEEKDAYS[new Date(p.year, p.month - 1, p.day).getDay()];
}
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
export function longDate(p: DayParts): string {
  return `${MONTH_NAMES[p.month - 1]} ${p.day}, ${p.year}`;
}
export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}
/** Comparable numeric date (y*10000 + m*100 + d). */
export function dateKey(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

/* ------------------------------ auto results ----------------------------- */

/** Deterministic pseudo-random value — backfill only, never today's reveal.
 *  Haruf King gets 3 digits (000–999); every other market gets 2 (00–99). */
export function autoResult(seedKey: string, day: number, month: number, year: number): string {
  const seed = `${seedKey}-${day}-${month}-${year}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const digits = resultDigits(seedKey);
  const mod = digits === 3 ? 1000 : 100;
  return (Math.abs(hash) % mod).toString().padStart(digits, "0");
}

/** Earliest entry date per market slug = its "generation" date (as a dateKey). */
export function firstEntryDates(
  charts: Array<{ chartName: string; date: number; month: number; year: number }>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of charts) {
    const s = slugify(c.chartName);
    const k = dateKey(c.year, c.month, c.date);
    const prev = m.get(s);
    if (prev === undefined || k < prev) m.set(s, k);
  }
  return m;
}

/* -------------------------------- taglines ------------------------------- */

/** Years used in the home tagline (2015 .. last year). */
export function taglineYears(): number[] {
  const cy = istNow().getFullYear();
  const out: number[] = [];
  for (let y = 2015; y < cy; y++) out.push(y);
  return out;
}

/** Earliest year the site covers — used by every selector, URL guard and validator. */
export const MIN_YEAR = 2015;

/** Year options for selectors (2015 .. current, newest first). */
export function yearOptions(): number[] {
  const cy = istNow().getFullYear();
  const out: number[] = [];
  for (let y = MIN_YEAR; y <= cy; y++) out.push(y);
  return out.reverse();
}

/* ------------------------------ monthly chart ---------------------------- */

export interface MonthChartLite {
  chartName: string;
  result: string;
  date: number;
  isHighlighted?: boolean;
  drawTime?: string | null;
}
export interface MonthlyRowData {
  date: number;
  values: Record<string, string>;
  red: boolean;
}

/**
 * Monthly rows: day 1 → today for the current month, full month for past months,
 * nothing for future months.
 *
 * Cell rules (first match wins):
 *   1. admin entry with a non-blank result   → that result
 *   2. past day + SPECIAL 4                  → auto 2-digit (always backfilled)
 *   3. past day + before market's generation → auto 2-digit
 *   4. past day + on/after generation        → "--"
 *   5. today                                 → "--" once draw time passed, else "XX"
 *   6. future day                            → "XX"
 *
 * Draw time used for today's gate: the TODAY entry's time wins; otherwise the
 * newest day's time within the selected month; otherwise the scheduled default.
 */
export function buildMonthlyRows(
  columns: Array<{ key: string }>,
  sel: { year: number; month: number },
  charts: MonthChartLite[],
  today: DayParts,
  nowMinutes: number,
  firstEntry: Map<string, number>,
  hidden: string[] = []
): MonthlyRowData[] {
  const hiddenSet = new Set(hidden);
  const byKey = new Map<string, MonthChartLite>();
  const timeBySlug = new Map<string, string>();
  const timeRank = new Map<string, number>();
  const isCurrentMonth = sel.year === today.year && sel.month === today.month;

  for (const c of charts) {
    const s = slugify(c.chartName);
    byKey.set(`${s}|${c.date}`, c);
    if (!c.drawTime) continue;
    const rank = isCurrentMonth && c.date === today.day ? 1_000_000 : c.date;
    const prev = timeRank.get(s);
    if (prev === undefined || rank > prev) {
      timeRank.set(s, rank);
      timeBySlug.set(s, c.drawTime);
    }
  }

  const dim = daysInMonth(sel.year, sel.month);
  const monthStart = new Date(sel.year, sel.month - 1, 1).getTime();
  const currentMonthStart = new Date(today.year, today.month - 1, 1).getTime();
  const lastDay = monthStart > currentMonthStart ? 0 : monthStart === currentMonthStart ? today.day : dim;
  const todayTime = new Date(today.year, today.month - 1, today.day).getTime();

  const rows: MonthlyRowData[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const values: Record<string, string> = {};
    const cellTime = new Date(sel.year, sel.month - 1, day).getTime();
    const cellKey = dateKey(sel.year, sel.month, day);

     for (const col of columns) {
      const db = byKey.get(`${col.key}|${day}`);

      // 1) FUTURE day → never a number, whatever is stored.
      if (cellTime > todayTime) {
        values[col.key] = UPCOMING_MARK;
        continue;
      }

      // 2) TODAY → the draw-time gate outranks ANY stored value, including a
      //    pre-seeded placeholder. Before the draw: "XX". After: real value or "--".
      if (cellTime === todayTime) {
        const mins = minutesOf(getDrawTime(col.key, timeBySlug.get(col.key)));
        if (nowMinutes < mins) {
          values[col.key] = UPCOMING_MARK;
        } else if (db && db.result.trim() !== "") {
          values[col.key] = db.result;
        } else {
          values[col.key] = MISSING_MARK;
        }
        continue;
      }

      // 3) PAST day → an admin/imported result always wins.
      if (db && db.result.trim() !== "") {
        values[col.key] = db.result;
        continue;
      }

      // 4) PAST day with no result → backfill (Special tables always, others pre-generation).
      const isHidden = hiddenSet.has(col.key);
      const isSpecial = SPECIAL_SLUGS.includes(col.key) && !isHidden;
      const gen = firstEntry.get(col.key);
      const beforeGeneration = isHidden ? false : gen === undefined ? true : cellKey < gen;
      values[col.key] =
        isSpecial || beforeGeneration
          ? autoResult(col.key, day, sel.month, sel.year)
          : MISSING_MARK;
    }

    rows.push({ date: day, values, red: charts.some((c) => c.date === day && c.isHighlighted) });
  }
  return rows;
}

/* ------------------------- resilient cached fetching ------------------------ */

export interface CacheableChart {
  id: string;
  chartName: string;
  result: string;
  date: number;
  month: number;
  year: number;
  isHighlighted: boolean;
  isActive: boolean;
  drawTime?: string | null;
  updatedAt?: string;
}

const CACHE_KEY = "skf-charts-cache-v1";
const HIDDEN_CACHE_KEY = "skf-charts-hidden-v1";

function readCache(): Record<string, CacheableChart[]> {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") as Record<string, CacheableChart[]>;
  } catch {
    return {};
  }
}

export function getCachedCharts(key: string): CacheableChart[] {
  try {
    return readCache()[key] || [];
  } catch {
    return [];
  }
}

function readHiddenCache(): Record<string, string[]> {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(HIDDEN_CACHE_KEY) || "{}") as Record<string, string[]>;
  } catch {
    return {};
  }
}

export function getCachedHidden(key: string): string[] {
  try {
    return readHiddenCache()[key] || [];
  } catch {
    return [];
  }
}

function setCachedHidden(key: string, slugs: string[]): void {
  try {
    if (typeof window === "undefined" || !Array.isArray(slugs)) return;
    const cache = readHiddenCache();
    cache[key] = slugs;
    localStorage.setItem(HIDDEN_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

/** A SUCCESSFUL response (even empty) is stored so deletions propagate; failed fetches never touch the cache. */
export function setCachedCharts(key: string, data: CacheableChart[]): void {
  try {
    if (typeof window === "undefined" || !Array.isArray(data)) return;
    const cache = readCache();
    cache[key] = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage blocked/full – ignore */
  }
}

/** Fetch with retries. Returns null ONLY when every attempt failed → caller keeps previous data. */
export async function fetchChartsResilient(
  url: string,
  cacheKey: string,
  attempts = 4
): Promise<CacheableChart[] | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (d && d.success === true && Array.isArray(d.data)) {
          setCachedCharts(cacheKey, d.data);
          setCachedHidden(cacheKey, Array.isArray(d.hidden) ? (d.hidden as string[]) : []);
          return d.data as CacheableChart[];
        }
      }
    } catch {
      /* network error – retry */
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return null;
}