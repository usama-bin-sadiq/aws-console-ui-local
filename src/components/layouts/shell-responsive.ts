/**
 * The console shell's small-screen contract, declared once.
 *
 * The shell is desktop-first: at every width the header, breadcrumb, service
 * rail and page tab strip are laid out for horizontal room and simply reflow
 * when there is none. That is right at 1024px and wrong at 320px, where a
 * service tab strip measured 56px tall, every header utility was a 16x19
 * target, and the breadcrumb was a row of 20px links.
 *
 * There are exactly two bands, and every rule in `shell-responsive.module.css`
 * is gated on one of them. `shell-responsive.test.ts` fails if the stylesheet
 * grows a third, differently-spelled breakpoint, because a stray `max-width`
 * is the failure mode that makes a "mobile" rule quietly stop applying to half
 * the shell while still looking correct in review.
 */

/**
 * Largest width, in CSS pixels, that still counts as a phone.
 *
 * 479px is the widest common phone width (iPhone 15 Pro Max, Pixel in
 * landscape) with a pixel of slack. 480px and up is a tablet or a large phone
 * held landscape, where the desktop arrangement has room and reads better, so
 * the phone treatment stops there.
 */
export const SHELL_PHONE_MAX_WIDTH = 479;

/**
 * Largest width at which the shell uses its compact treatment.
 *
 * 959px is the boundary AppShell already uses for `isCompactLayout` — the width
 * below which it stops rendering the `[Option+S]` keyboard hint and closes the
 * service rail on load. Reusing that number rather than inventing a third one
 * means "compact" means the same thing in the script and the stylesheet.
 */
export const SHELL_COMPACT_MAX_WIDTH = 959;

/**
 * The media query for the phone band. Must stay character for character in step
 * with {@link SHELL_PHONE_MAX_WIDTH}: a stylesheet cannot import this value, so
 * the agreement between the two is what the regression test checks in place of
 * a compiler.
 */
export const SHELL_PHONE_MEDIA_QUERY = `(max-width: ${SHELL_PHONE_MAX_WIDTH}px)`;

/**
 * The media query for the compact band. Same contract as
 * {@link SHELL_PHONE_MEDIA_QUERY}.
 */
export const SHELL_COMPACT_MEDIA_QUERY = `(max-width: ${SHELL_COMPACT_MAX_WIDTH}px)`;

/**
 * Smallest edge, in CSS pixels, a touch target may have. 24px is the WCAG 2.2
 * target-size minimum, and it is the floor the compact rules enforce on the
 * header and breadcrumb controls that Cloudscape sizes to their glyph.
 */
export const SHELL_MIN_TAP_TARGET_PX = 24;

/**
 * Tallest a page tab strip's bar may be on a phone. Cloudscape's own tab is
 * 44px, so this is "one Cloudscape tab" and nothing more: a label that wraps to
 * a second line is what took the bar from 46px to 56px, and a label too wide for
 * a phone already has the strip's horizontal scroll to travel through.
 */
export const SHELL_MAX_TAB_STRIP_PX = 44;

/**
 * Cloudscape's own width at which it stops treating the viewport as a phone and
 * makes the service rail an in-flow column: 688px, the `xs` breakpoint.
 *
 * The shell does not force Cloudscape's mode — that switch is global, and
 * flipping it would also change every Table, Container and ColumnLayout at the
 * same width. Instead the compact rules remove the one thing that costs layout
 * width above 688px, which is the zero-content flex spacer Cloudscape leaves in
 * the layout row. Recorded so a future change to either side is visible.
 */
export const SHELL_RAIL_OVERLAY_MAX_WIDTH = 959;

/**
 * Whether a viewport width is inside the shell's phone treatment.
 *
 * Only one behaviour needs it today: whether to render the keyboard-shortcut
 * hint, which is drawn into a gutter the field reserves either way.
 */
export function isShellPhoneWidth(width: number): boolean {
  return width <= SHELL_PHONE_MAX_WIDTH;
}

/**
 * Whether a viewport width is one where the service rail should overlay the
 * content rather than take a column from it.
 */
export function isShellRailOverlayWidth(width: number): boolean {
  return width <= SHELL_RAIL_OVERLAY_MAX_WIDTH;
}
