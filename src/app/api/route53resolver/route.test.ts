import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

/**
 * The module tests in endpoint-ip-validation.test.ts pin the rules; these pin
 * the consequence. A validator nobody calls is worth nothing, and the failure
 * this closes is a status code, so the status code is what is asserted here:
 * every shape the emulator answers with a 500 must leave the route as a 400
 * that names the entry, with the emulator never called.
 */

const send = vi.fn();

vi.mock("@/lib/data-isolation", () => ({
  requirePermission: vi.fn(async () => null),
}));

vi.mock("@/lib/aws-clients", () => ({
  getUserClientFromRequest: vi.fn(() => ({ send })),
}));

vi.mock("@/lib/adapter-error-handler", () => ({
  getAdapterStatus: () => ({
    reachable: true,
    endpoint: "http://localhost:4566",
    mode: "localemu",
  }),
  handleAdapterError: vi.fn(
    (error: unknown) =>
      new Response(JSON.stringify({ error: String(error), adapterHandled: true }), { status: 502 }),
  ),
}));

const SUBNET_A = "subnet-170a264164aba4372";
const SUBNET_B = "subnet-27831a7804bfe4f8f";

/** POST to the route with a body, and return the status and parsed JSON. */
async function post(body: unknown) {
  const { POST } = await import("./route");
  const response = await POST(
    new Request("http://localhost:3002/api/route53resolver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: response.status, json: await response.json() };
}

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ ResolverEndpoint: { Id: "rslvr-in-created" } });
});

describe("POST /api/route53resolver createEndpoint", () => {
  it("returns 400 and never calls the emulator when an entry has no SubnetId", async () => {
    // Emulator: 500 "...: 'SubnetId'"
    const { status, json } = await post({
      action: "createEndpoint",
      name: "no-subnet",
      ipAddresses: [{ Ip: "172.31.0.10" }, { Ip: "172.31.0.11" }],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("IpAddresses entry 1 is missing SubnetId");
    expect(json.message).toContain("IpAddresses entry 1");
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 400 and never calls the emulator when an Ip cannot be parsed", async () => {
    // Emulator: 500 "...: 'not-an-ip' does not appear to be an IPv4 or IPv6 address"
    const { status, json } = await post({
      action: "createEndpoint",
      name: "bad-ip",
      ipAddresses: [
        { SubnetId: SUBNET_A, Ip: "not-an-ip" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
      ],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("IpAddresses entry 1 has an invalid Ip: 'not-an-ip'");
    expect(json.message).toContain("not-an-ip");
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 400 for an entry that is not an object", async () => {
    // Emulator: 500 "Invalid type when parsing IpAddressRequest"
    const { status, json } = await post({
      action: "createEndpoint",
      ipAddresses: ["172.31.0.10", "172.31.0.11"],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("IpAddresses entry 1 must be an object with a SubnetId");
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps the fewer-than-two rule as a 400", async () => {
    const { status, json } = await post({
      action: "createEndpoint",
      ipAddresses: [{ SubnetId: SUBNET_A, Ip: "172.31.0.10" }],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("IpAddresses is required and must contain at least 2 addresses");
    expect(send).not.toHaveBeenCalled();
  });

  it("forwards a request whose Ip is omitted, because the emulator assigns one", async () => {
    const { status, json } = await post({
      action: "createEndpoint",
      name: "no-ip",
      ipAddresses: [{ SubnetId: SUBNET_A }, { SubnetId: SUBNET_B }],
    });
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command.input.IpAddresses).toEqual([{ SubnetId: SUBNET_A }, { SubnetId: SUBNET_B }]);
  });

  it("forwards a well-formed two-entry request unchanged", async () => {
    const ipAddresses = [
      { SubnetId: SUBNET_A, Ip: "172.31.0.10" },
      { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
    ];
    const { status } = await post({ action: "createEndpoint", name: "ok", ipAddresses });
    expect(status).toBe(200);
    expect(send.mock.calls[0][0].input.IpAddresses).toEqual(ipAddresses);
  });

  it("leaves the emulator's own rules alone: unknown subnet and out-of-CIDR both pass through", async () => {
    // Both are already 400s from the emulator, with messages that name the
    // subnet. The route has no subnet table, so it must not pre-empt them.
    for (const ipAddresses of [
      [
        { SubnetId: "subnet-does-not-exist", Ip: "172.31.0.10" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
      ],
      [
        { SubnetId: SUBNET_A, Ip: "192.168.99.5" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
      ],
    ]) {
      const { status } = await post({ action: "createEndpoint", ipAddresses });
      expect(status).toBe(200);
      expect(send).toHaveBeenCalledTimes(1);
      send.mockReset();
      send.mockResolvedValue({ ResolverEndpoint: { Id: "rslvr-in-created" } });
    }
  });

  it("still refuses an unknown action with 400", async () => {
    const { status, json } = await post({
      action: "updateResolverEndpoint",
      ipAddresses: [{ SubnetId: SUBNET_A, Ip: "172.31.0.10" }, { SubnetId: SUBNET_B }],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("Unknown action: updateResolverEndpoint. Supported: createEndpoint");
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts the createResolverEndpoint spelling too", async () => {
    const { status } = await post({
      action: "createResolverEndpoint",
      ipAddresses: [{ SubnetId: SUBNET_A }, { SubnetId: SUBNET_B }],
    });
    expect(status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
