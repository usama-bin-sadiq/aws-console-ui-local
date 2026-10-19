import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterEndpoint } from "@/config/adapter-config";

/**
 * Identifies which emulator is answering.
 *
 * The endpoint must come from the shared adapter config. Hardcoding
 * "http://localhost:4566" breaks in Docker: inside the console container
 * `localhost` is the console itself, not the emulator, so every probe failed
 * and this route always answered { provider: "unknown" }.
 *
 * Probe order matters - `_ministack` and `_localstack` are checked first, and
 * the configured provider last, so the most specific answer wins.
 */
export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  const base = getAdapterEndpoint();

  const probes: Array<[string, string]> = [
    ["ministack", `${base}/_ministack/health`],
    ["localstack", `${base}/_localstack/health`],
    ["localemu", `${base}/_localemu/health`],
  ];

  for (const [provider, url] of probes) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ provider, ...data });
      }
    } catch {
      // try the next provider
    }
  }

  return NextResponse.json(
    { provider: "unknown", status: "unreachable", endpoint: base },
    { status: 503 },
  );
}
