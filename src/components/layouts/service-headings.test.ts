import { describe, it, expect } from "vite-plus/test";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Service page heading consistency.
 *
 * A service console must have exactly one top-level heading. Two h1 elements
 * make the document outline ambiguous for screen readers, and in practice they
 * were the same service name twice: /secrets-manager and /route53 both rendered
 * "AWS Secrets Manager" and "Amazon Route 53" as consecutive h1s, while
 * /rds rendered "RDS" and then "RDS — Relational Database Service".
 *
 * The rule this test enforces: a page that sits under a route layout supplying
 * the service heading must not also declare its own h1. Its own heading is a
 * section heading and belongs at h2.
 */

const APP_DIR = join(process.cwd(), "src", "app");
const COMPONENT_DIR = join(process.cwd(), "src", "components");

/**
 * Source with comments removed.
 *
 * The heading checks below look for a literal `variant="h1"` in the file. A
 * comment that has to name that attribute — which is exactly what a fix for a
 * duplicate-heading bug wants to explain — otherwise trips the guard it is
 * describing, so the two fixes were mutually defeating. Matching code rather
 * than prose is what the check meant all along.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** Route segments for a page file, e.g. ["lambda", "layers"]. */
function segmentsOf(file: string): string[] {
  return relative(APP_DIR, file)
    .replace(/\\/g, "/")
    .replace(/\/?page\.tsx$/, "")
    .split("/")
    .filter(Boolean);
}

/**
 * True when an ancestor route layout supplies the page's top-level heading.
 * A layout that passes showServiceHeader={false} deliberately steps aside, so
 * the page must then own the h1 itself.
 */
function hasHeadingLayout(segments: string[]): boolean {
  for (let i = 1; i < segments.length; i += 1) {
    const layout = join(APP_DIR, ...segments.slice(0, i), "layout.tsx");
    if (existsSync(layout)) {
      const src = readFileSync(layout, "utf8");
      if (!src.includes("ServiceLayout")) continue;
      if (/showServiceHeader=\{false\}/.test(code(src))) return false;
      return true;
    }
  }
  return false;
}

const pages = walk(APP_DIR).filter((file) => file.endsWith("page.tsx"));

describe("service page headings", () => {
  it("finds pages to check", () => {
    expect(pages.length).toBeGreaterThan(100);
  });

  it("gives a page exactly one source of its own h1", () => {
    const offenders: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      const own = (code(src).match(/variant="h1"/g) || []).length;
      if (own > 1) offenders.push(`${relative(process.cwd(), file)} declares ${own} h1s`);
    }
    expect(offenders, "a page may declare at most one h1 of its own").toEqual([]);
  });

  it("demotes a page heading to h2 when a route layout already supplies one", () => {
    const offenders: string[] = [];
    for (const file of pages) {
      const segments = segmentsOf(file);
      if (!hasHeadingLayout(segments)) continue;
      const src = readFileSync(file, "utf8");
      if (/variant="h1"/.test(code(src))) {
        offenders.push(relative(process.cwd(), file));
      }
    }
    expect(
      offenders,
      "these pages sit under a layout that still renders the service h1, so their own heading must be h2",
    ).toEqual([]);
  });

  it("gives the page the h1 when its layout steps aside", () => {
    // /rds, /ecs, /vpc and /cloudwatch suppress the layout heading and let the
    // page own it, which is why their heading is the only top-level one.
    const steppedAside = ["rds", "ecs", "vpc", "cloudwatch"];
    for (const slug of steppedAside) {
      const layout = join(APP_DIR, slug, "layout.tsx");
      expect(code(readFileSync(layout, "utf8")), `${slug} layout`).toContain(
        "showServiceHeader={false}",
      );
      const page = join(APP_DIR, slug, "page.tsx");
      expect(code(readFileSync(page, "utf8")), `${slug} page`).toContain('variant="h1"');
    }
  });

  it("lets a nested service layout suppress the duplicate service heading", () => {
    const layout = join(COMPONENT_DIR, "service-layout", "ServiceLayout.tsx");
    const src = readFileSync(layout, "utf8");
    expect(code(src)).toContain("showServiceHeader");
    // The two layout variants must agree, otherwise a page cannot suppress the
    // heading on one and not the other.
    const outer = readFileSync(join(COMPONENT_DIR, "layouts", "ServiceLayout.tsx"), "utf8");
    expect(code(outer)).toContain("showServiceHeader");
  });

  it("demotes the nested layout heading where the route layout already has the h1", () => {
    // A page can render the inner ServiceLayout while still sitting under a route
    // layout that emits the service h1. The inner layout's own title then has to
    // be an h2, or the document ends up with two h1 elements.
    //
    // This cannot be decided statically: 42 pages render the inner layout under
    // some route layout, but only these 5 also have that route layout actually
    // render a heading. The rest pass showServiceHeader={false} somewhere, so
    // asserting on all 42 would report failures that do not exist. The list is
    // therefore the measured set, and the assertion is that each one opts out of
    // the duplicate.
    const doubleHeaded = [
      "appconfig",
      "cloudformation",
      "dynamodb/[tableName]",
      "s3/[bucketName]",
      "s3/[bucketName]/objects",
    ];
    const offenders: string[] = [];
    for (const slug of doubleHeaded) {
      const src = readFileSync(join(APP_DIR, slug, "page.tsx"), "utf8");
      if (!/headingLevel="h2"/.test(code(src))) offenders.push(slug);
    }
    expect(
      offenders,
      "these pages render the inner ServiceLayout under a route layout that already emits the service h1",
    ).toEqual([]);
  });

  it("lets the inner service layout choose its heading level", () => {
    // The prop has to exist and be wired to the Header, otherwise the five pages
    // above compile but silently render a second h1.
    const src = readFileSync(join(COMPONENT_DIR, "service-layout", "ServiceLayout.tsx"), "utf8");
    // Quote style is the formatter's business: this asserts the prop's type and
    // its wiring, not the delimiter the source happens to use.
    expect(code(src)).toMatch(/headingLevel\?:\s*["']h1["']\s*\|\s*["']h2["']/);
    expect(code(src)).toContain("variant={headingLevel}");
  });

  it("gives no service a placeholder title", () => {
    const placeholders = ['"AWS Service"', '"Service"', '"TODO"', '"Coming soon"', '"Placeholder"'];
    const offenders: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      for (const needle of placeholders) {
        if (src.includes(`serviceName=${needle}`)) {
          offenders.push(`${relative(process.cwd(), file)} -> ${needle}`);
        }
      }
    }
    expect(offenders, "a service page must name its service").toEqual([]);
  });

  it("keeps the app directory walkable", () => {
    expect(statSync(APP_DIR).isDirectory()).toBe(true);
  });
});
