/**
 * CSRF validation decision for API mutations.
 *
 * Kept as a pure module (no Next server imports) so it can be unit-tested
 * directly by Vitest.
 *
 * Background: the double-submit pieces already existed but were never enforced.
 * `validateCsrf` in `src/lib/session-store.ts` had zero call sites, so any
 * cross-site request could drive state-changing API calls using the ambient
 * session cookie. `src/proxy.ts` now enforces this centrally.
 */

import { timingSafeEqual } from "node:crypto";

export const CSRF_COOKIE = "aws_console_csrf";
export const CSRF_HEADER = "x-csrf-token";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Reachable before a session exists, so no CSRF cookie has been issued yet.
 * Login / signup / MFA verification all live under this single route.
 */
const EXEMPT_PREFIXES = ["/api/auth"];

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export function isCsrfExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Constant-time string comparison; length is compared first because
 *  `timingSafeEqual` throws on a length mismatch. */
export function timingSafeEqualStr(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Returns true when the request may proceed.
 *
 * Safe methods and auth routes always pass. A mutation passes only when the
 * double-submit cookie and the `x-csrf-token` header are both present and
 * identical: the browser attaches the cookie on its own, and only same-origin
 * JS can read it to mirror into the header, so a cross-site attacker can
 * satisfy neither.
 */
export function validateCsrfMutation(
  method: string,
  pathname: string,
  cookieToken: string | undefined,
  headerToken: string | undefined,
): boolean {
  if (!isMutatingMethod(method)) return true;
  if (isCsrfExempt(pathname)) return true;
  if (!cookieToken || !headerToken) return false;
  return timingSafeEqualStr(cookieToken, headerToken);
}
