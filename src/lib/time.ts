// The dummy data is written around this day. In the browser it is moved to the
// real today (see shiftDummy), so the demo always looks current.
export const DATA_ANCHOR = "2026-11-19";

// Real date in the browser. During the build there is no browser, so the anchor is used;
// pages that show dates wait for the browser before rendering (store `ready`), so the HTML matches.
export const TODAY = typeof window === "undefined" ? DATA_ANCHOR : toISO(new Date());

/** Days between the anchor and the real today. Every dummy date moves by this much. */
const SHIFT_DAYS = Math.round((parseISO(TODAY).getTime() - parseISO(DATA_ANCHOR).getTime()) / 86_400_000);

// The calendar shows the full day. Meetings can be at any time, because invitees
// decide for themselves by accepting or rejecting.
export const DAY_START = 0; // midnight
export const DAY_END = 24; // midnight
export const LAST_MIN = 23 * 60 + 59; // 11:59 PM, the latest end time on the same day
export const SCROLL_HOUR = 8; // the day view opens scrolled to 8 AM
export const HOUR_PX = 60;

/** The next quarter hour after the given minute, as "HH:MM". Used to move a start time out of the past. */
export function nextSlot(nowMin: number) {
  return fromMin(Math.min(Math.ceil(nowMin / 15) * 15, LAST_MIN - 15));
}

/** Moves a start time that has already passed today to the next quarter hour, keeping the duration. */
export function keepInFuture(date: string, start: string, end: string, nowMin: number) {
  if (date !== TODAY || toMin(start) >= nowMin) return { start, end };
  const length = Math.max(toMin(end) - toMin(start), 15);
  const s = nextSlot(nowMin);
  return { start: s, end: fromMin(Math.min(toMin(s) + length, LAST_MIN)) };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function fmtRange(start: string, end: string) {
  return `${fmtTime(start)} – ${fmtTime(end)}`;
}

export function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function weekStart(iso: string) {
  const d = parseISO(iso);
  d.setDate(d.getDate() - d.getDay());
  return toISO(d);
}

export function dayShort(iso: string) {
  return DAYS[parseISO(iso).getDay()];
}

export function dayLong(iso: string) {
  return DAYS_LONG[parseISO(iso).getDay()];
}

export function dayNum(iso: string) {
  return parseISO(iso).getDate();
}

export function fmtDate(iso: string) {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtDateLong(iso: string) {
  const d = parseISO(iso);
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthLabel(iso: string) {
  const d = parseISO(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function rangeLabel(fromIso: string, toIso: string) {
  const a = parseISO(fromIso);
  const b = parseISO(toIso);
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTHS_LONG[a.getMonth()]} ${a.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

/**
 * Minutes since midnight, from the real clock. `tick` is the store's timer value: passing it
 * makes callers re-read the clock every few seconds.
 */
export function nowMinutes(tick?: number) {
  void tick;
  if (typeof window === "undefined") return 10 * 60;
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

/** Label for activity logs and answers, such as "19 Nov, 2:05 PM". */
export function stampNow() {
  const now = new Date();
  return `${now.getDate()} ${MONTHS[now.getMonth()]}, ${fmtTime(fromMin(now.getHours() * 60 + now.getMinutes()))}`;
}

/**
 * Moves every date in the dummy data from the anchor week to the real current week:
 * ISO dates ("2026-11-20") and short labels ("20 Nov") inside any string.
 */
export function shiftDummy<T>(data: T): T {
  if (SHIFT_DAYS === 0) return data;
  const json = JSON.stringify(data)
    .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (iso) => addDays(iso, SHIFT_DAYS))
    .replace(/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (_, day: string, mon: string) => {
      const d = parseISO(addDays(`${DATA_ANCHOR.slice(0, 4)}-${String(MONTHS.indexOf(mon) + 1).padStart(2, "0")}-${day.padStart(2, "0")}`, SHIFT_DAYS));
      return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    });
  return JSON.parse(json) as T;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
}

/** Month grid: 6 weeks of ISO dates starting on the Sunday before the 1st. */
export function monthGrid(iso: string) {
  const d = parseISO(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = toISO(first);
  const gridStart = weekStart(start);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function addMonths(iso: string, n: number) {
  const d = parseISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** True when the item's date and end time are before now. */
export function isPast(date: string, end: string | undefined, nowMin: number) {
  if (date < TODAY) return true;
  if (date > TODAY) return false;
  return end ? toMin(end) <= nowMin : false;
}
