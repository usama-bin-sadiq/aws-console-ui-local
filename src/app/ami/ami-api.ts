"use client";

/**
 * Typed client helpers for the AMI API route (`/api/ami`) plus a small query
 * parameter hook used for deep links (`?imageId=`, `?tab=`).
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { AmiApiResponse } from "@/types/ami";

/** Region of the current user session (mirrors api-client's region header). */
export const CURRENT_REGION =
  process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1";

async function parseResponse(res: Response): Promise<AmiApiResponse> {
  const data = (await res.json().catch(() => ({}))) as AmiApiResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

/** GET /api/ami with query parameters. */
export async function amiGet(
  params: Record<string, string | undefined> = {},
): Promise<AmiApiResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, value);
  }
  const qs = query.toString();
  return parseResponse(await apiFetch(qs ? `/api/ami?${qs}` : "/api/ami"));
}

/** POST /api/ami with a JSON action payload. */
export async function amiPost(payload: Record<string, unknown>): Promise<AmiApiResponse> {
  return parseResponse(
    await apiFetch("/api/ami", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

/** DELETE /api/ami (deregister). */
export async function amiDelete(params: Record<string, string>): Promise<AmiApiResponse> {
  const qs = new URLSearchParams(params).toString();
  return parseResponse(await apiFetch(`/api/ami?${qs}`, { method: "DELETE" }));
}

/**
 * Reads a query parameter once on client navigation. Next updates the URL
 * before the target page's effects run, so wizard/detail deep links
 * (`?imageId=…`, `?tab=…`) resolve without a Suspense boundary.
 */
export function useQueryParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}
