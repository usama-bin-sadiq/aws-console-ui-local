import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import { lookupBucket } from "./bucket-lookup";

/**
 * The existence check that keeps a bucket's configuration UI from being
 * rendered for a bucket the emulator has never heard of.
 *
 * The cases that matter most are the ones where absence must NOT be reported:
 * an unreachable emulator, a forbidden read and an unreadable payload all look
 * like "no buckets came back" to a naive check, and telling a user their bucket
 * is gone when the request is what failed sends them after the wrong problem.
 */

const apiFetch = vi.fn();
vi.mock("@/lib/api-client", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("lookupBucket", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("reports a bucket that is in the list as found", async () => {
    apiFetch.mockResolvedValue(
      jsonResponse({ buckets: [{ Name: "aws-console-demo-assets" }, { Name: "other" }] }),
    );
    await expect(lookupBucket("aws-console-demo-assets")).resolves.toEqual({ status: "found" });
  });

  it("reports a bucket that is absent from the list as missing", async () => {
    apiFetch.mockResolvedValue(jsonResponse({ buckets: [{ Name: "aws-console-demo-assets" }] }));
    await expect(lookupBucket("no-such-bucket-xyz")).resolves.toEqual({ status: "missing" });
  });

  it("does not call a missing bucket a missing bucket when the emulator is unreachable", async () => {
    apiFetch.mockResolvedValue(
      jsonResponse(
        {
          error: "connect ECONNREFUSED 127.0.0.1:4566",
          errorKind: "unreachable",
          message: "The localemu adapter endpoint is unreachable.",
        },
        503,
      ),
    );
    const result = await lookupBucket("aws-console-demo-assets");
    expect(result.status).toBe("unavailable");
    expect(result).toMatchObject({ message: "The localemu adapter endpoint is unreachable." });
  });

  it("reports a forbidden read as unavailable, not as a missing bucket", async () => {
    apiFetch.mockResolvedValue(
      jsonResponse({ error: "Forbidden", message: "Required: s3:read" }, 403),
    );
    const result = await lookupBucket("aws-console-demo-assets");
    expect(result.status).toBe("unavailable");
    expect(result).toMatchObject({ message: "Required: s3:read" });
  });

  it("reports a thrown request as unavailable rather than missing", async () => {
    apiFetch.mockRejectedValue(new Error("Failed to fetch"));
    const result = await lookupBucket("aws-console-demo-assets");
    expect(result.status).toBe("unavailable");
    expect(result).toMatchObject({ message: "Failed to fetch" });
  });

  it("reports a non-200 without a body message as unavailable", async () => {
    apiFetch.mockResolvedValue(jsonResponse({}, 500));
    const result = await lookupBucket("aws-console-demo-assets");
    expect(result).toEqual({
      status: "unavailable",
      message: "Listing buckets failed (HTTP 500)",
    });
  });

  it("does not read an unrecognised payload as an empty bucket list", async () => {
    apiFetch.mockResolvedValue(jsonResponse({ unexpected: true }));
    const result = await lookupBucket("aws-console-demo-assets");
    expect(result.status).toBe("unavailable");
  });

  it("does not read an unparseable body as an empty bucket list", async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    } as unknown as Response);
    const result = await lookupBucket("aws-console-demo-assets");
    expect(result.status).toBe("unavailable");
  });

  it("treats an empty bucket list as a definitive missing bucket", async () => {
    apiFetch.mockResolvedValue(jsonResponse({ buckets: [] }));
    await expect(lookupBucket("anything")).resolves.toEqual({ status: "missing" });
  });
});
