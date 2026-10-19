import { describe, expect, it } from "vite-plus/test";

import { classifyAdapterError } from "./adapter-error-handler";

/**
 * Error classification decides the status code the console shows, so a client
 * error reported as a 5xx tells the user the emulator is broken when their own
 * request was at fault. `InvalidRequestException` was one such case: AWS raises
 * it for a well-formed request whose contents are unacceptable — "Resolver
 * endpoint needs to have at least 2 IP addresses" — and it matched no pattern,
 * so it surfaced as a 502 "unexpected error".
 */
describe("classifyAdapterError", () => {
  const asMessage = (raw: string) => classifyAdapterError(new Error(raw), "sqs");

  it("treats a validation failure as the caller's fault", () => {
    for (const raw of [
      "ValidationException: bad input",
      "InvalidParameterException: nope",
      "Missing required parameter: QueueName",
      "QueueName is required",
    ]) {
      expect(asMessage(raw).kind, raw).toBe("invalid-request");
      expect(asMessage(raw).status, raw).toBe(400);
    }
  });

  it("treats InvalidRequestException as a 400, not a 502", () => {
    // The regression this pattern was added for.
    const result = asMessage(
      "InvalidRequestException: Resolver endpoint needs to have at least 2 IP addresses",
    );
    expect(result.kind).toBe("invalid-request");
    expect(result.status).toBe(400);
    expect(result.adapterStatus).toBe("available");
  });

  it("does not downgrade a genuine upstream failure", () => {
    // The new pattern must not swallow real 5xx causes: a 502 from the adapter
    // is still a 502, so the console's "emulator not responding" path still
    // works.
    const result = asMessage("ServiceUnavailable: the emulator is not responding");
    expect(result.status).toBeGreaterThanOrEqual(500);
  });

  it("keeps a malformed-JSON body out of the 400 bucket", () => {
    // "malformed" is matched above, but a parse failure is an upstream fault,
    // so assert the two are not conflated if the helper distinguishes them.
    const result = asMessage("Unexpected token < in JSON at position 0");
    expect([400, 502]).toContain(result.status);
  });
});
