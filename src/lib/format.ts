/**
 * Date and duration formatting for console tables.
 *
 * Emulators return raw ISO 8601 timestamps, often with microseconds and a UTC
 * offset, e.g. "2026-09-25T19:41:22.974544+0000". Showing that verbatim is
 * accurate and unreadable, so console surfaces format it.
 *
 * These run in the browser and during SSR, so the output is pinned to a fixed
 * locale and time zone. A console that renders one timestamp differently on the
 * server and the client would trip React's hydration check, and a table that
 * shifts with the reader's locale is untestable.
 */

const FIXED_LOCALE = "en-US";
const FIXED_TIME_ZONE = "UTC";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Formats an ISO timestamp the way the AWS console shows "last modified":
 * "25 Sep 2026 19:41".
 *
 * The parts are assembled by hand rather than through `Intl.DateTimeFormat`
 * because ICU output varies between runtimes: the same options render as
 * "Sep 25 2026, 19:41" on one and "25 Sept 2026, 19:41" on another. A console
 * table has to read identically everywhere, and the caller has no way to
 * configure the ambient locale.
 */
export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = MONTHS[parsed.getUTCMonth()];
  const year = parsed.getUTCFullYear();
  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
}

/** Short relative form, e.g. "3 minutes ago". Falls back to the absolute form. */
export function formatRelativeTime(value: unknown, now: number = Date.now()): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const seconds = Math.round((parsed.getTime() - now) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 45) return "just now";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.348, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let remaining = seconds;
  for (const [size, unit] of units) {
    if (Math.abs(remaining) < size) {
      return new Intl.RelativeTimeFormat(FIXED_LOCALE, { numeric: "auto" }).format(
        Math.round(remaining),
        unit,
      );
    }
    remaining /= size;
  }
  return formatDateTime(value);
}

/** Formats a byte count with a binary unit, as S3 and EBS consoles do. */
export function formatBytes(bytes: unknown): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

/** Formats a millisecond duration, e.g. 1536 -> "1.54 s". */
export function formatDurationMs(ms: unknown): string {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes} min ${seconds} s`;
}
