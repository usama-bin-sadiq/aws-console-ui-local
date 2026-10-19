import { describe, it, expect } from "vite-plus/test";
import { formatDateTime, formatRelativeTime, formatBytes, formatDurationMs } from "./format";

/**
 * Console value formatting.
 *
 * The last item is a direct response to a screenshot: the Lambda overview showed
 * "updated 2026-09-25T19:41:22.974544+0000", which is what the emulator returns.
 * Output is pinned to a fixed locale and time zone so SSR and the client agree,
 * because a table that formats differently on the two trips React's hydration
 * check.
 */

describe("formatDateTime", () => {
  it("renders an emulator ISO timestamp readably", () => {
    expect(formatDateTime("2026-09-25T19:41:22.974544+0000")).toBe("25 Sep 2026 19:41 UTC");
  });

  it("handles a plain ISO timestamp", () => {
    expect(formatDateTime("2026-01-02T03:04:05Z")).toBe("02 Jan 2026 03:04 UTC");
  });

  it("returns a dash for missing or unparseable input", () => {
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime("not a date")).toBe("not a date");
  });

  it("never emits microseconds", () => {
    expect(formatDateTime("2026-09-25T19:41:22.974544+0000")).not.toMatch(/\.\d+/);
  });
});

describe("formatRelativeTime", () => {
  const NOW = Date.parse("2026-09-25T12:00:00Z");

  it("describes recent and distant times", () => {
    expect(formatRelativeTime("2026-09-25T11:59:50Z", NOW)).toBe("just now");
    expect(formatRelativeTime("2026-09-25T11:57:00Z", NOW)).toBe("3 minutes ago");
    expect(formatRelativeTime("2026-09-25T09:00:00Z", NOW)).toBe("3 hours ago");
    expect(formatRelativeTime("2026-09-24T12:00:00Z", NOW)).toBe("yesterday");
  });

  it("falls back safely", () => {
    expect(formatRelativeTime(undefined, NOW)).toBe("—");
    expect(formatRelativeTime("nonsense", NOW)).toBe("nonsense");
  });
});

describe("formatBytes", () => {
  it("uses binary units like the AWS console", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KiB");
    expect(formatBytes(1536)).toBe("1.5 KiB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GiB");
    expect(formatBytes(1024 ** 3 * 2.5)).toBe("2.5 GiB");
  });

  it("rejects nonsense", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes("512")).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("formatDurationMs", () => {
  it("scales the unit to the magnitude", () => {
    expect(formatDurationMs(12)).toBe("12 ms");
    expect(formatDurationMs(1536)).toBe("1.54 s");
    expect(formatDurationMs(90_000)).toBe("1 min 30 s");
  });

  it("rejects nonsense", () => {
    expect(formatDurationMs(-5)).toBe("—");
    expect(formatDurationMs("100")).toBe("—");
  });
});
