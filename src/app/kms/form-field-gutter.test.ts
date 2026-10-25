import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vite-plus/test";

/**
 * A form `Grid` must not overhang the box that contains it.
 *
 * Measured on /kms and /ecs: `FormField`'s control wrapper reported
 * `scrollWidth - clientWidth === 10` at 390px, 768px and 1440px alike. Ten
 * pixels, unmoved by a viewport 3.7x wider, can only be a fixed length, and the
 * only fixed length in that chain is Cloudscape's grid gutter. `FormField`
 * renders its control area as a `Grid` (`getGridDefinition` plus `InternalGrid`
 * in form-field/internal.js), and that grid carries
 * `margin-inline: calc(var(--space-grid-gutter, 20px) / -2)`. The grid is a
 * flexbox with percentage colspans, so there is no `fr` track and no inline
 * `grid-template-columns` to give up a min-content minimum: the earlier
 * `min-inline-size: 0` remedy could not have worked, and correctly did not.
 *
 * A margin is not something `min-inline-size` can influence, so compensating it
 * means overriding the margin. What follows pins the parts that make that a fix
 * rather than a clip:
 *
 *   - the routes that render a form field in normal flow carry the
 *     compensation, so deleting the wrapper fails here rather than quietly
 *     bringing the overflow back;
 *   - the grid's margin and the grid column's padding are cancelled *together*,
 *     because that padding is what puts the control back on its label's edge.
 *     Cancelling the margin alone shifts every control 10px right; cancelling
 *     the padding alone pulls the control 10px out of the card;
 *   - the gutter is read from the installed Cloudscape rather than hardcoded,
 *     so a version that changes it is caught here instead of resurfacing later
 *     as a different number of stray pixels;
 *   - nothing is clipped, and no selector can reach another service.
 */

const REPO = process.cwd();
const MODULE = "form-field-gutter.module.css";
const CLOUDSCAPE_GRID_CSS = join(
  REPO,
  "node_modules/@cloudscape-design/components/grid/styles.scoped.css",
);

/** Routes under these two services that render a `FormField` in normal flow. */
const ROUTES = ["kms", "kms/create", "ecs"] as const;

/** The two route trees, each with its own copy of the module. */
const TREES = ["kms", "ecs"] as const;

const read = (path: string): string => readFileSync(join(REPO, path), "utf8");

/**
 * Every rule in a stylesheet, as `selector -> declarations`.
 *
 * Comments are stripped first: Cloudscape's scoped sheets open with a long
 * licence block, and a selector captured across it is not the selector.
 */
function rules(css: string): Array<[string, string]> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => [
    match[1].trim(),
    match[2],
  ]);
}

/** Declarations of the one rule with exactly this selector. */
function declarationsFor(css: string, selector: string): string {
  const found = rules(css).find(([sel]) => sel === selector);
  if (!found) {
    throw new Error(
      `no rule for ${selector}; saw ${rules(css)
        .map(([s]) => s)
        .join(" | ")}`,
    );
  }
  return found[1];
}

/** Cloudscape's own grid-root inline margin, and what it costs per side. */
function cloudscapeGridGutter(): { declaration: string; overhangPerSide: number } {
  const css = readFileSync(CLOUDSCAPE_GRID_CSS, "utf8");
  const root = rules(css).find(([sel]) => /^\.awsui_grid_[A-Za-z0-9_]+:not\(#/.test(sel));
  if (!root) throw new Error("Cloudscape's grid root selector changed shape");
  const margin = root[1].match(/margin-inline:\s*([^;]+);/);
  if (!margin) throw new Error("the grid root no longer sets margin-inline");
  const gutter = margin[1].match(/var\(\s*--space-grid-gutter[^,]*,\s*(\d+(?:\.\d+)?)px\s*\)/);
  if (!gutter) throw new Error(`cannot resolve the gutter from: ${margin[1]}`);
  return { declaration: margin[1].trim(), overhangPerSide: Number(gutter[1]) / 2 };
}

/** The Cloudscape grid-column inline padding, resolved the same way. */
function cloudscapeColumnPadding(): string {
  const css = readFileSync(CLOUDSCAPE_GRID_CSS, "utf8");
  const column = rules(css).find(([sel]) => /^\.awsui_grid-column_[A-Za-z0-9_]+:not\(#/.test(sel));
  if (!column) throw new Error("Cloudscape's grid-column selector changed shape");
  const padding = column[1].match(/padding-inline:\s*([^;]+);/);
  if (!padding) throw new Error("the grid column no longer sets padding-inline");
  return padding[1].trim();
}

/** The route layout that wraps a route: `kms/create` -> `src/app/kms/layout.tsx`. */
const layoutFor = (route: string): string => `src/app/${route.split("/")[0]}/layout.tsx`;

/**
 * Whether a file, or anything it pulls in from this repo, renders a
 * `FormField`.
 *
 * One hop is enough for the component that matters — /kms renders
 * `@/components/KMSCore`, which is where its form fields live — and a route
 * that names one itself needs no looking further.
 */
function rendersFormField(path: string, depth = 3): boolean {
  if (!existsSync(join(REPO, path))) return false;
  const src = readFileSync(join(REPO, path), "utf8");
  if (/<FormField[\s>]/.test(src)) return true;
  if (depth === 0) return false;
  for (const [, specifier] of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    if (!specifier.startsWith("@/")) continue;
    const base = join(REPO, "src", specifier.slice(2));
    for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx")]) {
      if (existsSync(candidate)) {
        if (rendersFormField(relative(REPO, candidate), depth - 1)) return true;
        break;
      }
    }
  }
  return false;
}

describe("form grid gutter compensation", () => {
  const gutter = cloudscapeGridGutter();

  it("measures the overhang this exists to remove", () => {
    // The defect was 10px at every width. A Cloudscape upgrade that changes
    // the gutter fails here, which is the point: the number below is derived
    // from the package, not remembered.
    expect(gutter.declaration).toMatch(/^calc\(var\(--space-grid-gutter[^/]*\/ -2\)$/);
    expect(gutter.overhangPerSide).toBe(10);
  });

  for (const route of ROUTES) {
    it(`compensates the form grid on /${route}`, () => {
      const page = `src/app/${route}/page.tsx`;
      expect(
        rendersFormField(page),
        `${page} is expected to render a form field; if it no longer does, drop it from ROUTES`,
      ).toBe(true);

      // The wrapper is what the compensation hangs off, so losing it is what
      // brings the overflow back. It has to wrap ServiceLayout rather than a
      // single child, or a sibling route in the same tree keeps the defect.
      const layout = read(layoutFor(route));
      expect(layout).toMatch(/import styles from "\.\/form-field-gutter\.module\.css";/);
      expect(layout).toMatch(/<div className=\{styles\.page\}>\s*<ServiceLayout/);
    });
  }

  for (const tree of TREES) {
    it(`cancels the gutter rather than clipping it, in src/app/${tree}`, () => {
      const css = read(`src/app/${tree}/${MODULE}`);

      // Anchored on `awsui_controls`, which only FormField emits, and reaching
      // the grid as its child. A bare `[class*="awsui_grid"]` would also match a
      // ColumnLayout or a Grid placed on the page, and those are multi-column:
      // their negative margin is what lines the outer columns up with the card
      // edge, so cancelling it there would break them.
      const GRID = '.page [class*="awsui_controls_"] > [class*="awsui_grid_"]';
      const COLUMN = `${GRID} > [class*="awsui_grid-column_"]`;

      // Both halves, because they are a pair. `!important` because Cloudscape's
      // scoped selectors carry `:not(#\9)`, which counts as an ID for
      // specificity and would otherwise win on declaration order alone.
      const grid = declarationsFor(css, GRID);
      expect(grid).toMatch(/margin-inline:\s*0\s*!important/);
      expect(grid).not.toMatch(/overflow|clip/);

      expect(declarationsFor(css, COLUMN)).toMatch(/padding-inline:\s*0\s*!important/);

      // The padding being cancelled has to be the same length as the margin
      // being cancelled, or the two no longer describe the same box and the
      // control stops lining up with its label.
      expect(cloudscapeColumnPadding()).toBe(
        cloudscapeGridGutter().declaration.replace("/ -2", "/ 2"),
      );

      // Every selector stays under the route's own class, or this module
      // becomes a global restyle of every other service's form fields.
      const selectors = rules(css).map(([sel]) => sel);
      expect(selectors.length).toBeGreaterThan(0);
      for (const selector of selectors) {
        expect(selector.startsWith(".page "), `unscoped selector: ${selector}`).toBe(true);
      }
    });
  }

  it("keeps the two route modules equivalent", () => {
    // They are separate files on purpose — a shared one would let /kms restyle
    // /ecs — so what has to stay identical is the compensation itself, not the
    // prose, which each copy points at the other tree.
    expect(rules(read(`src/app/kms/${MODULE}`))).toEqual(rules(read(`src/app/ecs/${MODULE}`)));
  });
});
