import { describe, it, expect } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The console shell's small-screen contract.
 *
 * The phone treatment is entirely CSS, and a CSS module cannot import a
 * TypeScript constant, so the breakpoint values are written twice: once in
 * `shell-responsive.ts`, which the shell's script reads, and once as literals in
 * `shell-responsive.module.css`, which the browser reads. Nothing in the
 * compiler keeps those two copies in step, and the failure when they drift is
 * silent: the script stops rendering the keyboard hint at one width while the
 * stylesheet keeps reserving room for it at another, or a rule stops applying
 * to half the shell while still looking correct in review.
 *
 * These tests are the substitute for that compiler. They are deliberately about
 * the *rule* rather than about the look: a rule that can be broken by an edit
 * and caught by a test is worth more than a rule that happens to hold today.
 */

const LAYOUT_DIR = join(process.cwd(), "src", "components", "layouts");
const CSS_FILE = join(LAYOUT_DIR, "shell-responsive.module.css");
const APP_SHELL = join(process.cwd(), "src", "components", "AppShell.tsx");
const SERVICE_LAYOUT = join(LAYOUT_DIR, "ServiceLayout.tsx");

const css = readFileSync(CSS_FILE, "utf8");
const appShell = readFileSync(APP_SHELL, "utf8");
const serviceLayout = readFileSync(SERVICE_LAYOUT, "utf8");

/** Every `max-width` / `min-width` literal that gates a rule in the stylesheet. */
function mediaQueryWidths(source: string): number[] {
  return [...source.matchAll(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)/g)].map((m) => Number(m[1]));
}

describe("shell responsive contract", () => {
  it("declares the two shell bands in the stylesheet and nowhere else", async () => {
    const { SHELL_PHONE_MAX_WIDTH, SHELL_COMPACT_MAX_WIDTH } = await import("./shell-responsive");

    expect(mediaQueryWidths(css).sort((a, b) => a - b)).toEqual(
      [SHELL_PHONE_MAX_WIDTH, SHELL_COMPACT_MAX_WIDTH].sort((a, b) => a - b),
    );
  });

  it("groups the stylesheet into one block per declared band", () => {
    // A third `max-width` is the failure this file exists to prevent: it looks
    // deliberate, it applies to a different part of the shell than the band above
    // it, and nothing reconciles the two. One block per band also means moving a
    // rule between bands is a visible edit rather than a copy-and-paste.
    const blocks = [...css.matchAll(/@media[^{]*\{/g)].map((m) => m[0].trim());
    expect(blocks, "the stylesheet may only gate on the two declared bands").toHaveLength(2);
    for (const block of blocks) {
      expect(
        mediaQueryWidths(`${block}{`),
        `"${block}" is not one of the declared bands`,
      ).toHaveLength(1);
    }
  });

  it("keeps every shell rule out of the desktop widths", async () => {
    const { SHELL_COMPACT_MAX_WIDTH } = await import("./shell-responsive");
    // 1440px and 1920px are the widths the stored visual baselines are taken at,
    // so nothing in the phone treatment may reach them. A stylesheet that grew a
    // `min-width` gate above 1024px would silently re-record 24 baselines.
    for (const width of mediaQueryWidths(css)) {
      expect(width).toBeLessThan(1024);
    }
    expect(SHELL_COMPACT_MAX_WIDTH).toBeLessThan(1024);
  });

  it("reads the compact boundary from the shared constant, not a literal", () => {
    // AppShell used to hardcode `< 960`. The compact band's media query is
    // derived from the same number, and the two have to be the same number or
    // the shell closes the rail at one width and renders the keyboard hint at
    // another.
    expect(appShell).toContain("SHELL_COMPACT_MAX_WIDTH");
    expect(appShell).not.toMatch(/innerWidth\s*<\s*9\d\d/);
  });

  it("reuses one stylesheet for both components that own shell chrome", () => {
    // The header lives in AppShell and the tab strip in the route-driven
    // ServiceLayout. If either stops importing the module, half the phone
    // treatment disappears and nothing fails.
    expect(appShell).toMatch(/import\s+"@\/components\/layouts\/shell-responsive\.module\.css"/);
    expect(serviceLayout).toMatch(
      /import\s+"@\/components\/layouts\/shell-responsive\.module\.css"/,
    );
  });

  it("publishes the tab strip's height budget on the DOM", () => {
    // The bar's height is set in CSS, so the only way a test or a measurement can
    // check the contract without re-deriving the number is for the component to
    // state it. `data-tab-strip-max` is read by neither today; it is the record
    // of the budget the stylesheet is written against.
    expect(serviceLayout).toContain("data-tab-strip-max={SHELL_MAX_TAB_STRIP_PX}");
    expect(serviceLayout).toMatch(
      /import\s+\{[^}]*SHELL_MAX_TAB_STRIP_PX[^}]*\}\s+from\s+"@\/components\/layouts\/shell-responsive"/,
    );
  });

  it("makes the service rail dismissible with Escape while it is open", () => {
    // Cloudscape focuses the rail's close button when it opens, so a keyboard
    // user can already dismiss it with Enter, but Escape is the dismissal every
    // panel in this console answers and the rail is a full-screen overlay on a
    // phone. Without this the only way out is to find the close control.
    expect(appShell).toMatch(/closeRailOnEscape/);
    expect(appShell).toMatch(/if \(e\.key !== "Escape"\) return;/);
    // Gated on the rail actually being on screen, or Escape on a route with no
    // rail would write the "rail closed" preference and silently unpin it.
    expect(appShell).toMatch(/if \(!showSidebar \|\| !navigationOpen\) return;/);
  });

  it("states the tap floor and the tab budget the stylesheet is written against", async () => {
    const { SHELL_MIN_TAP_TARGET_PX, SHELL_MAX_TAB_STRIP_PX } = await import("./shell-responsive");
    // 24px is the WCAG 2.2 target-size minimum; 44px is one Cloudscape tab.
    expect(SHELL_MIN_TAP_TARGET_PX).toBe(24);
    expect(SHELL_MAX_TAB_STRIP_PX).toBe(44);
    // The stylesheet must not quietly grow a different floor than the one the
    // module declares. `min-block-size: 24px` is the tap floor; a bare or
    // `max-` `block-size` is the tab strip's height budget. The negative
    // lookbehind is what keeps `min-block-size` out of the second list.
    const floors = [...css.matchAll(/min-(?:inline|block)-size:\s*(\d+)px/g)].map((m) =>
      Number(m[1]),
    );
    expect(new Set(floors), "every minimum size in the stylesheet is the tap floor").toEqual(
      new Set([SHELL_MIN_TAP_TARGET_PX]),
    );
    const budgets = [...css.matchAll(/(?<![-a-z])(?:max-)?block-size:\s*(\d+)px/g)].map((m) =>
      Number(m[1]),
    );
    expect(new Set(budgets), "every fixed block size in the stylesheet is the tab budget").toEqual(
      new Set([SHELL_MAX_TAB_STRIP_PX]),
    );
  });
});
