import { describe, it, expect } from "vite-plus/test";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveActiveTabId } from "./ServiceLayout";

/**
 * Service tab integrity.
 *
 * A Cloudscape `<Tabs>` entry that declares neither `content` nor `href` is a
 * dead control: the tab bar renders, the click changes internal state, and
 * nothing is shown and no navigation happens. The AWS service consoles use the
 * tab bar as navigation, so every tab must have a real destination.
 *
 * These tests cover both kinds of tab in the app:
 *   1. in-page `<Tabs>` blocks must supply `content` or `href`
 *   2. service layout tabs must point at a route that actually exists
 */

const APP_DIR = join(process.cwd(), "src", "app");
const SRC_DIR = join(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Index just past the balanced bracket opened at `start`, or -1. */
function matchBracket(src: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === open) depth += 1;
    else if (src[i] === close) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

interface TabDefinition {
  readonly label: string;
  readonly content: boolean;
  readonly href: boolean;
}

/** Every `<Tabs>` tab literal in the source tree. */
function collectTabDefinitions(): { file: string; tab: TabDefinition }[] {
  const found: { file: string; tab: TabDefinition }[] = [];

  for (const file of walk(SRC_DIR)) {
    const src = readFileSync(file, "utf8");
    if (!src.includes("<Tabs")) continue;

    const pattern = /tabs=\{/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(src)) !== null) {
      const braceStart = match.index + "tabs=".length;
      const end = matchBracket(src, braceStart, "{", "}");
      if (end < 0) continue;
      const inner = src.slice(braceStart + 1, end - 1).trim();
      if (!inner.startsWith("[")) continue;
      const arrayEnd = matchBracket(inner, 0, "[", "]");
      if (arrayEnd < 0) continue;
      const body = inner.slice(1, arrayEnd - 1);

      let index = 0;
      while (index < body.length) {
        if (body[index] !== "{") {
          index += 1;
          continue;
        }
        const objEnd = matchBracket(body, index, "{", "}");
        if (objEnd < 0) break;
        const obj = body.slice(index, objEnd);
        found.push({
          file,
          tab: {
            label: (obj.match(/label:\s*[`'"]([^`'"]*)[`'"]/) || [])[1] || "(dynamic)",
            content: /(^|[^a-zA-Z])content:/.test(obj),
            href: /(^|[^a-zA-Z])href:/.test(obj),
          },
        });
        index = objEnd;
      }
    }
  }

  return found;
}

/** Every `page.tsx` route the app serves, as concrete paths plus dynamic patterns. */
function collectRoutes(): { concrete: Set<string>; patterns: string[][] } {
  const concrete = new Set<string>();
  const patterns: string[][] = [];

  for (const file of walk(APP_DIR)) {
    if (file.endsWith(`${"page"}.tsx`)) {
      const route = file
        .slice(APP_DIR.length)
        .replace(/[\\/]page\.tsx$/, "")
        .replace(/\\/g, "/")
        .replace(/\/+$/, "");
      const segments = route.split("/").filter(Boolean);
      if (segments.some((segment) => segment.startsWith("["))) {
        patterns.push(segments);
      } else {
        concrete.add(route);
      }
    }
  }

  return { concrete, patterns };
}

function routeExists(href: string, routes: ReturnType<typeof collectRoutes>): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "");
  if (routes.concrete.has(path)) return true;
  const segments = path.split("/").filter(Boolean);
  return routes.patterns.some(
    (pattern) =>
      pattern.length === segments.length &&
      pattern.every((segment, i) => segment.startsWith("[") || segment === segments[i]),
  );
}

describe("in-page Cloudscape tabs", () => {
  const definitions = collectTabDefinitions();

  it("finds the tab bars in the app", () => {
    expect(definitions.length).toBeGreaterThan(50);
  });

  it("never declares a tab without content or href", () => {
    const dead = definitions.filter(({ tab }) => !tab.content && !tab.href);
    expect(
      dead.map((entry) => `${entry.file} "${entry.tab.label}"`),
      "these tabs render but can never show anything or navigate",
    ).toEqual([]);
  });
});

describe("service layout tabs", () => {
  const routes = collectRoutes();
  const layoutFiles = walk(APP_DIR).filter(
    (file) => file.endsWith("layout.tsx") && readFileSync(file, "utf8").includes("tabs={"),
  );

  /** `{ label: "...", href: "/..." }` pairs declared in a layout's tabs prop. */
  function collectLayoutTabs(src: string): { label: string; href: string }[] {
    const pattern = /tabs=\{\[/g;
    const tabs: { label: string; href: string }[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(src)) !== null) {
      const arrayStart = match.index + "tabs={".length;
      const arrayEnd = matchBracket(src, arrayStart, "[", "]");
      if (arrayEnd < 0) continue;
      const body = src.slice(arrayStart + 1, arrayEnd - 1);
      for (const entry of body.matchAll(/label:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"/g)) {
        tabs.push({ label: entry[1], href: entry[2] });
      }
    }
    return tabs;
  }

  it("has at least the two services that use real AWS tab bars", () => {
    expect(layoutFiles.length).toBeGreaterThanOrEqual(2);
  });

  it("points every service tab at a route that exists", () => {
    const broken: string[] = [];
    for (const file of layoutFiles) {
      for (const tab of collectLayoutTabs(readFileSync(file, "utf8"))) {
        if (!routeExists(tab.href, routes)) {
          broken.push(`${file.slice(process.cwd().length + 1)} "${tab.label}" -> ${tab.href}`);
        }
      }
    }
    expect(broken, "service tabs must lead to a real page").toEqual([]);
  });

  it("gives every tab in a bar a distinct destination", () => {
    const duplicates: string[] = [];
    for (const file of layoutFiles) {
      const tabs = collectLayoutTabs(readFileSync(file, "utf8"));
      const seen = new Set<string>();
      for (const tab of tabs) {
        if (seen.has(tab.href))
          duplicates.push(`${file.slice(process.cwd().length + 1)} ${tab.href}`);
        seen.add(tab.href);
      }
    }
    expect(duplicates, "two tabs in one bar must not point at the same page").toEqual([]);
  });
});

describe("active tab resolution", () => {
  const lambdaTabs = [
    { id: "overview-0", href: "/lambda" },
    { id: "functions-1", href: "/lambda/functions" },
    { id: "layers-2", href: "/lambda/layers" },
    { id: "monitoring-3", href: "/lambda/monitoring" },
  ];

  const s3Tabs = [
    { id: "buckets-0", href: "/s3" },
    { id: "permissions-1", href: "/s3/permissions" },
    { id: "metrics-2", href: "/s3/metrics" },
  ];

  it("selects the tab matching the exact URL", () => {
    expect(resolveActiveTabId(lambdaTabs, "/lambda")).toBe("overview-0");
    expect(resolveActiveTabId(lambdaTabs, "/lambda/functions")).toBe("functions-1");
    expect(resolveActiveTabId(lambdaTabs, "/lambda/layers")).toBe("layers-2");
    expect(resolveActiveTabId(lambdaTabs, "/lambda/monitoring")).toBe("monitoring-3");
  });

  it("keeps the nearest tab selected on a nested route", () => {
    // /lambda is a prefix of /lambda/functions, so the longer href must win.
    expect(resolveActiveTabId(lambdaTabs, "/lambda/functions/my-fn")).toBe("functions-1");
    expect(resolveActiveTabId(lambdaTabs, "/lambda/monitoring/detail")).toBe("monitoring-3");
  });

  it("tolerates a trailing slash", () => {
    expect(resolveActiveTabId(lambdaTabs, "/lambda/functions/")).toBe("functions-1");
  });

  it("falls back to the first tab on an unrelated route", () => {
    expect(resolveActiveTabId(lambdaTabs, "/lambda/create")).toBe("overview-0");
    expect(resolveActiveTabId(s3Tabs, "/s3/create")).toBe("buckets-0");
  });

  it("does not match a sibling that merely shares a prefix", () => {
    // "/lambda/layers" must not be selected for "/lambda/layerss".
    expect(resolveActiveTabId(lambdaTabs, "/lambda/layerss")).toBe("overview-0");
  });

  it("returns undefined when there are no tabs", () => {
    expect(resolveActiveTabId([], "/lambda")).toBeUndefined();
  });

  it("gives every Lambda and S3 route a selected tab", () => {
    for (const route of ["/lambda", "/lambda/functions", "/lambda/monitoring", "/lambda/create"]) {
      expect(resolveActiveTabId(lambdaTabs, route), route).toBeDefined();
    }
    for (const route of ["/s3", "/s3/permissions", "/s3/metrics", "/s3/create"]) {
      expect(resolveActiveTabId(s3Tabs, route), route).toBeDefined();
    }
  });
});

describe("route inventory", () => {
  it("discovers the app's pages", () => {
    const { concrete, patterns } = collectRoutes();
    expect(concrete.size).toBeGreaterThan(100);
    expect(patterns.length).toBeGreaterThan(0);
  });

  it("has no leftover placeholder page directory", () => {
    // /s3/buckets duplicated /s3 and was removed when the S3 tab bar was wired.
    expect(existsSync(join(APP_DIR, "s3", "buckets"))).toBe(false);
  });

  it("resolves dynamic routes as well as concrete ones", () => {
    const { concrete, patterns } = collectRoutes();
    expect(routeExists("/lambda/functions", { concrete, patterns })).toBe(true);
    expect(routeExists("/lambda/monitoring", { concrete, patterns })).toBe(true);
    expect(routeExists("/s3/permissions", { concrete, patterns })).toBe(true);
    expect(routeExists("/s3/metrics", { concrete, patterns })).toBe(true);
    // Dynamic segment: /lambda/[functionName] matches any single extra segment.
    expect(routeExists("/lambda/my-fn", { concrete, patterns })).toBe(true);
    // Too deep for that route, and unknown at the top level.
    expect(routeExists("/lambda/functions/my-fn/extra", { concrete, patterns })).toBe(false);
    expect(routeExists("/not-a-service", { concrete, patterns })).toBe(false);
  });
});

describe("layout files are readable", () => {
  it("can stat the app directory", () => {
    expect(statSync(APP_DIR).isDirectory()).toBe(true);
  });
});
