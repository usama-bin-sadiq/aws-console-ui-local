/**
 * Same-origin API client.
 *
 * Authentication is carried by the server-managed HttpOnly session cookie.
 * The browser must never read or send AWS secret keys or privileged identity
 * headers. Authenticated mutations use the double-submit CSRF cookie.
 *
 * This is also where console-wide failure reporting happens. Every page reaches
 * the API through `apiFetch`, so a response the user needs to know about is
 * surfaced here rather than only inside whichever page happened to make the
 * call. The rules are deliberately narrow, because a console that cries wolf on
 * every background poll is worse than one that stays quiet:
 *
 *   - a failed mutation always reports: the user just pressed a button
 *   - a failed read reports only on 5xx, and only once per endpoint per window
 *   - 4xx reads are not reported, because a 404 is often a legitimate empty
 *     state (GetBucketPolicy answering NoSuchBucketPolicy, for example)
 *   - 401 and 403 are not reported, because the session flow handles those
 */

import { publishNotification } from "./notification-bus";

const CSRF_COOKIE = "aws_console_csrf";

/** Suppresses repeat reports for the same endpoint within this window. */
const DEDUPE_WINDOW_MS = 10_000;

const reported = new Map<string, number>();

function shouldReport(key: string, now: number): boolean {
  const last = reported.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
  reported.set(key, now);
  return true;
}

/** Test-only. */
export function resetFailureReporting(): void {
  reported.clear();
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!value) return null;
  try {
    return decodeURIComponent(value.slice(prefix.length));
  } catch {
    return null;
  }
}

function isMutation(method: string | undefined): boolean {
  return Boolean(method && !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()));
}

/** Human-readable label for an API path, e.g. "/api/lambda" -> "Lambda". */
export function describeEndpoint(url: string | URL, method: string): string {
  let path: string;
  try {
    path = new URL(url.toString(), "http://localhost").pathname;
  } catch {
    path = String(url);
  }
  const segment = path.split("/").filter(Boolean)[1] ?? path;
  const name = segment
    .replace(/^api\//, "")
    .split("/")[0]
    .replace(/[-_]+/g, " ")
    .trim();
  const pretty = name ? name.charAt(0).toUpperCase() + name.slice(1) : path;
  return method.toUpperCase() === "GET" ? pretty : `${pretty} (${method.toUpperCase()})`;
}

/**
 * Reads the server's own error text without consuming the body the caller is
 * about to read. A clone is used deliberately.
 */
async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const clone = response.clone();
    const data = (await clone.json()) as { error?: unknown; message?: unknown };
    const text = data?.error ?? data?.message;
    return typeof text === "string" && text.trim() ? text.trim().slice(0, 300) : undefined;
  } catch {
    return undefined;
  }
}

function statusHeadline(status: number, method: string, url: string | URL): string {
  if (status === 502 || status === 503) {
    return "The local emulator is not responding";
  }
  if (status >= 500) {
    return `${describeEndpoint(url, method)} failed (HTTP ${status})`;
  }
  if (status === 404) {
    return `${describeEndpoint(url, method)} was not found (HTTP 404)`;
  }
  return `${describeEndpoint(url, method)} failed (HTTP ${status})`;
}

async function reportFailure(response: Response, url: string | URL, method: string): Promise<void> {
  const status = response.status;
  if (status >= 200 && status < 400) return;
  // The session flow owns these.
  if (status === 401 || status === 403) return;

  const mutation = isMutation(method);
  if (!mutation && status < 500) return;

  const now = Date.now();
  if (!shouldReport(`${method.toUpperCase()} ${url} ${status}`, now)) return;

  const detail = await readErrorDetail(response);
  publishNotification({
    level: "error",
    header: statusHeadline(status, method, url),
    detail,
  });
}

export async function apiFetch(
  url: string | URL,
  init?: RequestInit & { json?: unknown },
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const method = init?.method ?? "GET";

  if (isMutation(method)) {
    const csrfToken = getCookie(CSRF_COOKIE);
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  const doFetch = (finalInit: RequestInit) =>
    fetch(url, finalInit).then((response) => {
      // Reporting is best-effort and never changes what the caller receives.
      void reportFailure(response, url, method).catch(() => {});
      return response;
    });

  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    const finalInit: RequestInit = {
      ...init,
      headers,
      credentials: init.credentials ?? "same-origin",
      body: JSON.stringify(init.json),
    };
    delete (finalInit as RequestInit & { json?: unknown }).json;
    return doFetch(finalInit);
  }

  return doFetch({
    ...init,
    headers,
    credentials: init?.credentials ?? "same-origin",
  });
}
