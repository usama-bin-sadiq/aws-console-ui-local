import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vite-plus/test";

const APP_DIR = join(process.cwd(), "src", "app");

/** Every page file under src/app. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === "page.tsx") out.push(full);
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

/**
 * Body of the Container whose opening tag starts at `open`, and the index just
 * past its matching close.
 *
 * Containers nest, so the first `</Container>` after the opening tag is not
 * necessarily this container's own: in src/app/health the outer card contains
 * an inner Container holding the table, and taking the first close would end the
 * outer one early and then re-scan its interior as if it were outside.
 */
function containerBody(src: string, open: number): { body: string; next: number } | null {
  const end = tagEnd(src, open + "<Container".length);
  if (end === -1) return null;
  const from = end + 1;
  let depth = 1;
  let i = from;
  while (i < src.length && depth > 0) {
    const nextOpen = src.indexOf("<Container", i);
    const nextClose = src.indexOf("</Container>", i);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      const nestedEnd = tagEnd(src, nextOpen + "<Container".length);
      if (nestedEnd === -1) return null;
      depth += 1;
      i = nestedEnd + 1;
    } else {
      depth -= 1;
      i = nextClose + "</Container>".length;
    }
  }
  if (depth !== 0) return null;
  return { body: src.slice(from, i), next: i };
}

describe("table borders", () => {
  const pages = walk(APP_DIR);

  it("finds pages to check", () => {
    expect(pages.length).toBeGreaterThan(100);
  });

  it("tags every Container that wraps a Table", () => {
    // Cloudscape's Table draws its own card border, so a bordered Container
    // around one puts two concentric borders on the page. A Container is the
    // card and the table drops its border, which is what `aws-table-card` does.
    //
    // Measured before this rule: 14 double-bordered tables across 10 of 20
    // sampled pages. The tag has to be on the *outer* card, not on a container
    // nested inside it, because the stylesheet strips borders from boxes
    // *inside* a tagged one. A container nested inside a tagged one therefore
    // needs no tag of its own, and its whole subtree is skipped.
    const offenders: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      let pos = 0;
      for (;;) {
        const open = src.indexOf("<Container", pos);
        if (open === -1) break;
        const found = containerBody(src, open);
        if (!found) break;
        const tag = src.slice(open, tagEnd(src, open + "<Container".length) + 1);
        if (tag.includes("aws-table-card")) {
          // Already a card: it keeps its border and strips those inside it.
          pos = found.next;
          continue;
        }
        if (found.body.includes("<Table")) {
          offenders.push(relative(process.cwd(), file));
          break;
        }
        pos = found.next;
      }
    }
    expect(
      offenders,
      "a Container holding a Table is the card, so it must be tagged aws-table-card",
    ).toEqual([]);
  });

  it("makes the stylesheet win against Cloudscape's runtime-injected borders", () => {
    // Cloudscape sets `border-block`/`border-inline` from styles injected after
    // globals.css, so a plain `border: none` loses on declaration order. Every
    // border reset aimed at it needs the logical longhands and `!important`,
    // otherwise it silently does nothing — which is how
    // `.aws-service-layout__container` kept a 1px border and put a second one
    // around every table on 10 pages.
    const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    for (const selector of [".aws-service-layout__container", ".aws-table-card"]) {
      const at = css.indexOf(selector + " ");
      expect(at, `${selector} rule exists`).toBeGreaterThan(-1);
      const block = css.slice(at, css.indexOf("}", at));
      expect(block, `${selector} resets the logical longhands`).toContain("border-block");
      expect(block, `${selector} resets the physical shorthand`).toMatch(
        /border(-block|-inline)?:\s*(none|0)\s*!important/,
      );
    }
  });

  it("keeps the content inset owned by the shell alone", () => {
    // The shell applies the page inset once. If the inner layout or a page adds
    // another, the page title and the content it titles end up on different
    // axes — measured 36px apart.
    const layout = readFileSync(
      join(process.cwd(), "src", "components", "service-layout", "ServiceLayout.tsx"),
      "utf8",
    );
    expect(layout).toContain('className="service-content"');
    const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const at = css.indexOf(".service-content");
    expect(at, ".service-content rule exists").toBeGreaterThan(-1);
    expect(css.slice(at, css.indexOf("}", at))).toMatch(/padding:\s*0\s*!important/);
  });
});
