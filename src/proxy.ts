import { NextResponse, type NextRequest } from "next/server";
import { validateCsrfMutation } from "@/lib/csrf-mutation";

/**
 * CSRF enforcement for API mutations.
 *
 * `validateCsrf` in `src/lib/session-store.ts` existed and was unit-tested but
 * had zero call sites, so state-changing API calls were reachable cross-site
 * with the ambient session cookie. This Proxy enforces the double-submit check
 * centrally instead of touching all 116 routes.
 *
 * The decision logic lives in `@/lib/csrf-mutation` so it is unit-testable
 * without a Next server runtime.
 *
 * Note: the `middleware` convention is deprecated and renamed to `proxy` in
 * Next.js 16. Proxy defaults to the Node.js runtime, which `@/lib/csrf-mutation`
 * needs for `node:crypto`.
 */
export function proxy(request: NextRequest): NextResponse {
  const cookieToken = request.cookies.get("aws_console_csrf")?.value ?? undefined;
  const headerToken = request.headers.get("x-csrf-token") ?? undefined;

  const allowed = validateCsrfMutation(
    request.method,
    request.nextUrl.pathname,
    cookieToken,
    headerToken,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "CSRF validation failed: missing or mismatched CSRF token." },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
