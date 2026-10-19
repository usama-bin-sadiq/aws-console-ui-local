import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vite-plus/test";

const ROOTS = ["src/app", "src/components", "src/features"].map((d) => join(process.cwd(), d));

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** Index of the `>` closing the tag opened at `start`, tracking brace depth. */
function tagEnd(src: string, start: number): number {
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    else if (ch === ">" && depth === 0) return i;
  }
  return -1;
}

/** Whether the element whose opening tag ends at `end` has any visible label. */
function childText(src: string, end: number): boolean {
  if (
    src
      .slice(0, end + 1)
      .trimEnd()
      .endsWith("/>")
  )
    return false;
  const close = src.indexOf("</Button>", end);
  if (close === -1) return false;
  const children = src.slice(end + 1, close).replace(/<[^>]*>/g, " ");
  if (children.replace(/\s+/g, " ").trim()) return true;
  // `{addLabel}` and `{isCustomizing ? "Done" : "Customize"}` are visible
  // labels even though they are not literal text. Stripping every
  // interpolation, as a first version of this check did, reported both of those
  // buttons as unlabelled when they are not.
  return (
    /\{\s*[A-Za-z_$][\w$.]*\s*\}/.test(children) || // bare identifier
    /["']/.test(children) // a string literal anywhere in the expression
  );
}

describe("icon-only controls have an accessible name", () => {
  const files = ROOTS.flatMap((r) => walk(r)).filter((f) => !f.includes(".test."));

  it("finds files to check", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("labels every icon-only button", () => {
    // A button showing nothing but a glyph has no accessible name, so a screen
    // reader announces just "button". Cloudscape requires ariaLabel for this
    // case, and the codebase already uses it elsewhere.
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/<Button\b/g)) {
        const start = m.index ?? 0;
        const end = tagEnd(src, start + "<Button".length);
        if (end === -1) continue;
        const tag = src.slice(start, end + 1);
        if (!tag.includes("iconName")) continue;
        const labelled =
          tag.includes("ariaLabel") || tag.includes("aria-label") || tag.includes("ariaLabelledby");
        if (labelled || childText(src, end)) continue;
        const line = src.slice(0, start).split("\n").length;
        offenders.push(`${relative(process.cwd(), file)}:${line}`);
      }
    }
    expect(offenders, "an icon-only button needs an ariaLabel").toEqual([]);
  });

  it("labels every image", () => {
    // Decorative images take alt=""; meaningful ones take a description. Either
    // way the attribute has to be there.
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/<Image\b[^>]*?\/>/g)) {
        if (!m[0].includes("alt=")) {
          const line = src.slice(0, m.index ?? 0).split("\n").length;
          offenders.push(`${relative(process.cwd(), file)}:${line}`);
        }
      }
    }
    expect(offenders, "every image needs an alt attribute").toEqual([]);
  });
});
