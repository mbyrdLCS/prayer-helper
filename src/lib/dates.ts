const TZ = process.env.APP_TIMEZONE || "America/New_York";

/** YYYY-MM-DD for a given Date in the app timezone. */
export function dayString(d: Date = new Date()): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Today's date string in the app timezone. */
export function today(): string {
  return dayString();
}

/** Add n days to a YYYY-MM-DD string, returning a YYYY-MM-DD string. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** Inclusive range of YYYY-MM-DD strings. */
export function dateRange(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** "Monday, June 30, 2026" style label for a YYYY-MM-DD string. */
export function prettyDate(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

/** "Jun 30" short label. */
export function shortDate(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(dt);
}
