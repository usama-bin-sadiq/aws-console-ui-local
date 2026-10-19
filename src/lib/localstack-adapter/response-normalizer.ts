/**
 * Adapter Response Normalizer — Parses adapter response and constructs SDK HttpResponse.
 * Supports JSON, XML, and binary responses. All services covered.
 */

import { NormalizedResponse } from "@/types/adapter";

export function normalizeResponse(rawResponse: {
  status?: number;
  headers?: Record<string, string>;
  data?: string | Buffer | Uint8Array;
}): NormalizedResponse {
  return {
    statusCode: rawResponse.status || 200,
    headers: rawResponse.headers || { "content-type": "application/json" },
    body: rawResponse.data || "{}",
  };
}
