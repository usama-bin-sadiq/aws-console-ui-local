import { describe, it, expect, beforeEach, afterEach, vi } from "vite-plus/test";
import { describeEndpoint, apiFetch, resetFailureReporting } from "./api-client";
import {
  subscribeToNotifications,
  resetNotificationSubscribers,
  type AppNotification,
} from "./notification-bus";

/**
 * Console failure reporting.
 *
 * `apiFetch` is the single path every page uses to reach the API, so it is where
 * the console reports failures. Before this, nothing in the app ever published a
 * notification, which is why the alert surface existed but never appeared.
 */

const received: AppNotification[] = [];

function collect() {
  return subscribeToNotifications((n) => received.push(n));
}

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn();

/**
 * Failure reporting is deliberately fire-and-forget so it can never delay or
 * break the caller's request, so a test must let the queue drain before it
 * asserts on what was reported.
 */
async function flush(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

beforeEach(() => {
  received.length = 0;
  resetNotificationSubscribers();
  resetFailureReporting();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notification bus", () => {
  it("delivers to every subscriber", async () => {
    const a: AppNotification[] = [];
    const b: AppNotification[] = [];
    subscribeToNotifications((n) => a.push(n));
    subscribeToNotifications((n) => b.push(n));
    fetchMock.mockResolvedValue(jsonResponse(500, { error: "boom" }));

    await apiFetch("/api/lambda");
    await flush();
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
  });

  it("isolates a subscriber that throws", async () => {
    const seen: AppNotification[] = [];
    subscribeToNotifications(() => {
      throw new Error("listener exploded");
    });
    subscribeToNotifications((n) => seen.push(n));
    fetchMock.mockResolvedValue(jsonResponse(500));

    await apiFetch("/api/lambda");
    await flush();
    expect(seen.length).toBe(1);
  });

  it("unsubscribes cleanly", async () => {
    const off = collect();
    off();
    fetchMock.mockResolvedValue(jsonResponse(500));
    await apiFetch("/api/lambda");
    await flush();
    expect(received).toHaveLength(0);
  });
});

describe("describeEndpoint", () => {
  it("turns an API path into a readable label", () => {
    expect(describeEndpoint("/api/lambda", "GET")).toBe("Lambda");
    expect(describeEndpoint("/api/s3/buckets", "GET")).toBe("S3");
    expect(describeEndpoint("/api/dynamodb", "POST")).toBe("Dynamodb (POST)");
    expect(describeEndpoint("/api/auto-scaling", "GET")).toBe("Auto scaling");
  });
});

describe("failure reporting policy", () => {
  it("reports a failed mutation", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "name already exists" }));

    await apiFetch("/api/lambda", { method: "POST" });
    await flush();
    expect(received).toHaveLength(1);
    expect(received[0].level).toBe("error");
    expect(received[0].detail).toBe("name already exists");
  });

  it("reports a 5xx read", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(502));

    await apiFetch("/api/lambda");
    await flush();
    expect(received).toHaveLength(1);
    expect(received[0].header).toMatch(/not responding/i);
  });

  it("does not report a 4xx read, which is often a legitimate empty state", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(404, { error: "NoSuchBucketPolicy" }));

    await apiFetch("/api/s3?action=policy");
    await flush();
    expect(received).toHaveLength(0);
  });

  it("does not report 401 or 403, which the session flow owns", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(401));
    await apiFetch("/api/lambda");
    await flush();
    expect(received).toHaveLength(0);

    fetchMock.mockResolvedValue(jsonResponse(403));
    await apiFetch("/api/lambda", { method: "POST" });
    await flush();
    expect(received).toHaveLength(0);
  });

  it("does not report a successful response", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(200, { functions: [] }));
    await apiFetch("/api/lambda");
    await flush();
    expect(received).toHaveLength(0);
  });

  it("suppresses repeats from the same endpoint within the window", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(500));

    await apiFetch("/api/lambda");
    await apiFetch("/api/lambda");
    await apiFetch("/api/lambda");
    await flush();
    expect(received).toHaveLength(1);
  });

  it("still reports a different endpoint", async () => {
    collect();
    fetchMock.mockResolvedValue(jsonResponse(500));

    await apiFetch("/api/lambda");
    await apiFetch("/api/s3");
    await flush();
    expect(received).toHaveLength(2);
  });

  it("reports distinct statuses from the same endpoint separately", async () => {
    collect();
    fetchMock.mockResolvedValueOnce(jsonResponse(500));
    await apiFetch("/api/lambda");
    fetchMock.mockResolvedValueOnce(jsonResponse(503));
    await apiFetch("/api/lambda");
    await flush();
    expect(received).toHaveLength(2);
  });

  it("leaves the response body readable for the caller", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { error: "adapter exploded" }));

    const response = await apiFetch("/api/lambda");
    // The reporter clones the body, so the caller can still consume it.
    expect(await response.json()).toEqual({ error: "adapter exploded" });
  });

  it("never rejects because reporting failed", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500));
    await expect(apiFetch("/api/lambda")).resolves.toBeInstanceOf(Response);
  });

  it("still passes through a network rejection untouched", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(apiFetch("/api/lambda")).rejects.toThrow("network down");
  });
});
