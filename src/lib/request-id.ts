/**
 * Request-ID middleware for Next.js App Router.
 * Usage: export { addRequestId } from '@/lib/request-id' / middleware.ts
 */
import { NextRequest, NextResponse } from "next/server";

export function addRequestId(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set("X-Request-ID", requestId);
  return response;
}
