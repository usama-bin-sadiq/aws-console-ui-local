import { NextResponse } from "next/server";
import { ADAPTER_CONFIG, getAdapterEndpoint } from "@/config/adapter-config";

export interface AdapterStatus {
  reachable: boolean;
  endpoint: string;
  mode: string;
}

type AdapterErrorKind =
  | "unreachable"
  | "license-required"
  | "operation-unsupported"
  | "invalid-request"
  | "not-found"
  | "forbidden"
  | "protocol-mismatch"
  | "upstream-error";

interface ClassifiedAdapterError {
  kind: AdapterErrorKind;
  status: number;
  adapterStatus: "unreachable" | "unavailable" | "degraded" | "available";
  message: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown adapter error";
}

function includesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function classifyAdapterError(error: unknown, mode: string): ClassifiedAdapterError {
  const rawMessage = errorMessage(error);
  const normalized = rawMessage.toLowerCase();

  if (
    includesAny(normalized, [
      /not included within your .*license/,
      /available in an upgraded license/,
      /license.*required/,
    ])
  ) {
    return {
      kind: "license-required",
      status: 503,
      adapterStatus: "unavailable",
      message: `The active ${mode} emulator does not include this service under its current license. Upgrade the emulator or choose a supported service.`,
    };
  }

  if (
    includesAny(normalized, [
      /not currently supported/,
      /not supported by (localstack|ministack)/,
      /unknown operation/,
      /unable to find operation/,
      /operation .* is not implemented/,
      /has not been implemented/,
      /not implemented/,
      /unknown .* action/,
      /no route for (get|post|put|delete|patch)/,
      /not valid for this web service/,
    ])
  ) {
    return {
      kind: "operation-unsupported",
      status: 503,
      adapterStatus: "unavailable",
      message: `The active ${mode} emulator does not support this operation. The API route remains available for a compatible emulator.`,
    };
  }

  if (
    includesAny(normalized, [
      /econnrefused/,
      /enotfound/,
      /econnreset/,
      /fetch failed/,
      /socket hang up/,
      /timeout/,
      /timed out/,
      /network error/,
    ])
  ) {
    return {
      kind: "unreachable",
      status: 503,
      adapterStatus: "unreachable",
      message: `The ${mode} adapter endpoint is unreachable. Ensure the emulator container is running.`,
    };
  }

  if (
    includesAny(normalized, [
      /validationexception/,
      /invalidparam/,
      // AWS raises InvalidRequestException for a well-formed request whose
      // contents are unacceptable — "Resolver endpoint needs to have at least 2
      // IP addresses", for one. It is a client error, but it matched none of the
      // patterns below, so it fell through to a 502 "the adapter returned an
      // unexpected error", which tells the caller nothing and reads as an
      // emulator fault rather than bad input.
      /invalidrequest/,
      /missing required/,
      /no value provided/,
      /is required/,
      /must be supplied/,
      /malformed/,
    ])
  ) {
    return {
      kind: "invalid-request",
      status: 400,
      adapterStatus: "available",
      message: rawMessage,
    };
  }

  if (includesAny(normalized, [/not found/, /nosuch/, /does not exist/])) {
    return {
      kind: "not-found",
      status: 404,
      adapterStatus: "available",
      message: rawMessage,
    };
  }

  if (includesAny(normalized, [/access denied/, /accessdenied/, /unauthorized/, /forbidden/])) {
    return {
      kind: "forbidden",
      status: 403,
      adapterStatus: "available",
      message: rawMessage,
    };
  }

  if (
    includesAny(normalized, [
      /deserialization error/,
      /unexpected token ['"]?<[^a-z]/,
      /invalid json/,
    ])
  ) {
    return {
      kind: "protocol-mismatch",
      status: 502,
      adapterStatus: "degraded",
      message: `The ${mode} adapter returned a response that does not match the AWS SDK protocol. Verify the service implementation and endpoint before retrying.`,
    };
  }

  return {
    kind: "upstream-error",
    status: 502,
    adapterStatus: "degraded",
    message: `The ${mode} adapter returned an unexpected error: ${rawMessage}`,
  };
}

export function getAdapterStatus(): AdapterStatus {
  const mode = ADAPTER_CONFIG.adapterMode;
  const endpoint = getAdapterEndpoint(mode);
  // This function is intentionally synchronous because it is used inside
  // route handlers. `reachable` means configured; the health endpoint is the
  // authoritative network-reachability check.
  return { reachable: true, endpoint, mode };
}

export function handleAdapterError(error: unknown, mode: string, endpoint: string): NextResponse {
  const classified = classifyAdapterError(error, mode);
  const rawMessage = errorMessage(error);

  return NextResponse.json(
    {
      adapterMode: true,
      adapterEndpoint: endpoint,
      provider: mode,
      error: rawMessage,
      errorKind: classified.kind,
      adapterStatus: classified.adapterStatus,
      message: classified.message,
    },
    {
      status: classified.status,
      headers: {
        "x-adapter-mode": mode,
        "x-adapter-endpoint": endpoint,
        "x-adapter-status": classified.adapterStatus,
        "x-adapter-error": classified.kind,
      },
    },
  );
}
