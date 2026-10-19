import { describe, it, expect } from "vite-plus/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SERVICE_NAVIGATION } from "@/constants/service-navigation";

/**
 * Left navigation integrity.
 *
 * A rail entry that points at a route the app does not serve is a dead control
 * in the place users look first for navigation, and it defeats the service
 * catalogue: the entry exists, so the service is advertised, but clicking it
 * cannot work. The existing uniqueness test covers the other half of the problem,
 * two entries sharing a destination, which also breaks active-state resolution.
 */

const APP_DIR = join(process.cwd(), "src", "app");

/** A route exists if it is concrete, or is covered by a dynamic segment. */
function routeExists(href: string, patterns: string[][]): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "");
  if (existsSync(join(APP_DIR, path, "page.tsx"))) return true;
  const segments = path.split("/").filter(Boolean);
  return patterns.some(
    (pattern) =>
      pattern.length === segments.length &&
      pattern.every((segment, i) => segment.startsWith("[") || segment === segments[i]),
  );
}

function collectPatterns(): string[][] {
  const patterns: string[][] = [];
  const stack = [APP_DIR];
  while (stack.length) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === "page.tsx") {
        const segments = full
          .slice(APP_DIR.length)
          .replace(/[\\/]page\.tsx$/, "")
          .split("/")
          .filter(Boolean);
        if (segments.some((s) => s.startsWith("["))) patterns.push(segments);
      }
    }
  }
  return patterns;
}

describe("service navigation", () => {
  const patterns = collectPatterns();
  const allLinks = Object.entries(SERVICE_NAVIGATION).flatMap(([key, groups]) =>
    groups.flatMap((group) => group.items.map((item) => ({ service: key, ...item }))),
  );

  it("has navigation to check", () => {
    expect(allLinks.length).toBeGreaterThan(40);
  });

  it("points every entry at a route the app serves", () => {
    const dead = allLinks
      .filter((link) => !routeExists(link.href, patterns))
      .map((link) => `${link.service} "${link.text}" -> ${link.href}`);
    expect(dead, "these rail entries lead nowhere").toEqual([]);
  });

  it("keeps destinations unique within a service", () => {
    const duplicates: string[] = [];
    for (const [key, groups] of Object.entries(SERVICE_NAVIGATION)) {
      const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
      const seen = new Set<string>();
      for (const href of hrefs) {
        if (seen.has(href)) duplicates.push(`${key} ${href}`);
        seen.add(href);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it("gives every group at least one entry", () => {
    const empty: string[] = [];
    for (const [key, groups] of Object.entries(SERVICE_NAVIGATION)) {
      for (const group of groups) {
        if (!group.items || group.items.length === 0) empty.push(`${key} / ${group.text}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it("covers the services that have their own console", () => {
    const keys = new Set(Object.keys(SERVICE_NAVIGATION));
    for (const key of [
      "ec2",
      "lambda",
      "s3",
      "vpc",
      "iam",
      "dynamodb",
      "cloudwatch",
      "rds",
      "ecs",
      "kms",
      "route53",
      "secrets-manager",
      "sns",
      "sqs",
      "kinesis",
      "firehose",
      "sfn",
      "athena",
      "opensearch",
      "redshift",
      "backup",
      "cloudtrail",
      "config",
      "guardduty",
      "waf",
      "cognito",
      "acm",
      "efs",
      "elb",
      "eventbridge",
      "auto-scaling",
      "appsync",
      "ecr",
      "eks",
    ]) {
      expect(keys.has(key), `${key} should have a left rail`).toBe(true);
    }
  });
});
