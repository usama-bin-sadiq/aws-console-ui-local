import { describe, expect, it } from "vite-plus/test";
import {
  MIN_ENDPOINT_ADDRESSES,
  isIpAddress,
  isIpv4Address,
  validateIpAddresses,
} from "./endpoint-ip-validation";

/**
 * `IpAddresses` is the one field of CreateResolverEndpoint whose malformed
 * shape the emulator reports by raising, not by refusing: a missing `SubnetId`
 * and an unparseable `Ip` both come back as a 500, which the console surfaces as
 * a degraded-adapter error and a "the emulator is not responding" toast. These
 * cases pin the shapes that used to escape to the route's 400, and — just as
 * importantly — the shapes that must keep being forwarded, because the emulator
 * creates an endpoint for them.
 */

const SUBNET_A = "subnet-170a264164aba4372";
const SUBNET_B = "subnet-27831a7804bfe4f8f";

/** The 400 the route returns, or null when the list may be forwarded. */
function rejection(entries: unknown) {
  return validateIpAddresses(entries);
}

describe("validateIpAddresses", () => {
  it("names the entry whose SubnetId is missing", () => {
    const result = rejection([{ SubnetId: SUBNET_A, Ip: "172.31.0.10" }, { Ip: "172.31.0.11" }]);
    expect(result).not.toBeNull();
    expect(result?.error).toBe("IpAddresses entry 2 is missing SubnetId");
    expect(result?.message).toContain("IpAddresses entry 2");
    expect(result?.message).toContain("SubnetId");
  });

  it("names the entry when no entry carries a SubnetId", () => {
    const result = rejection([{ Ip: "172.31.0.10" }, { Ip: "172.31.0.11" }]);
    // Entry 1 is the first thing wrong, and the emulator never sees entry 2.
    expect(result?.error).toBe("IpAddresses entry 1 is missing SubnetId");
  });

  it("treats a null or blank SubnetId as missing, the way a reader would", () => {
    // Both are 500s at the emulator rather than clean refusals, so they cannot
    // be left to it, and neither is a usable subnet id either way.
    for (const subnetId of [null, "", "   ", 42, {}, []]) {
      const result = rejection([
        { SubnetId: SUBNET_A, Ip: "172.31.0.10" },
        { SubnetId: subnetId, Ip: "172.31.16.10" },
      ]);
      expect(result?.error).toBe("IpAddresses entry 2 is missing SubnetId");
    }
  });

  it("names the entry whose Ip cannot be parsed", () => {
    const result = rejection([
      { SubnetId: SUBNET_A, Ip: "172.31.0.10" },
      { SubnetId: SUBNET_B, Ip: "not-an-ip" },
    ]);
    expect(result?.error).toBe("IpAddresses entry 2 has an invalid Ip: 'not-an-ip'");
    expect(result?.message).toContain("IpAddresses entry 2");
    expect(result?.message).toContain("not-an-ip");
  });

  it("refuses the other spellings the emulator's parser throws on", () => {
    // Every one of these is a 500 from the emulator, not a 400.
    for (const ip of [
      "not-an-ip",
      "172.31.0",
      "172.31.0.1.2",
      "172.31.0.999",
      "172.31.0.010",
      "172.31.0.10/24",
      "172.31.0.-1",
      "   ",
      " 172.31.0.10 ",
      "172.31.0.10 ",
      "localhost",
    ]) {
      const result = rejection([{ SubnetId: SUBNET_A, Ip: ip }, { SubnetId: SUBNET_B }]);
      expect(result?.error, `expected ${JSON.stringify(ip)} to be refused`).toBe(
        `IpAddresses entry 1 has an invalid Ip: '${ip}'`,
      );
    }
  });

  it("refuses an entry that is not an object at all", () => {
    for (const entry of ["172.31.0.10", null, 42, [], true]) {
      const result = rejection([entry, { SubnetId: SUBNET_B, Ip: "172.31.16.10" }]);
      expect(result?.error, `expected ${JSON.stringify(entry)} to be refused`).toBe(
        "IpAddresses entry 1 must be an object with a SubnetId",
      );
      expect(result?.message).toContain("IpAddresses entry 1");
    }
  });

  it("refuses an Ip that is present but is not a string", () => {
    const result = rejection([{ SubnetId: SUBNET_A, Ip: 123 }, { SubnetId: SUBNET_B }]);
    expect(result?.error).toBe("IpAddresses entry 1 has an Ip that is not a string");
    expect(result?.message).toContain("IpAddresses entry 1");
  });

  it("still refuses fewer than two addresses", () => {
    expect(MIN_ENDPOINT_ADDRESSES).toBe(2);
    for (const entries of [
      [],
      [{ SubnetId: SUBNET_A, Ip: "172.31.0.10" }],
      // Shorter than the minimum and malformed: the length answer is the useful one.
      [{ Ip: "172.31.0.10" }],
      "not-an-array",
      undefined,
      null,
      { SubnetId: SUBNET_A },
    ]) {
      const result = rejection(entries);
      expect(result?.error, `expected ${JSON.stringify(entries)} to be refused`).toBe(
        "IpAddresses is required and must contain at least 2 addresses",
      );
      expect(result?.message).toContain("at least 2 IP addresses");
    }
  });

  it("accepts a well-formed two-entry request", () => {
    expect(
      rejection([
        { SubnetId: SUBNET_A, Ip: "172.31.0.10" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
      ]),
    ).toBeNull();
  });

  it("accepts an omitted, null or empty Ip, because the emulator assigns one", () => {
    // The emulator treats all three as "choose a free address in the subnet"
    // and creates the endpoint, so requiring Ip would reject a working request.
    for (const ip of [undefined, null, ""]) {
      expect(
        rejection([{ SubnetId: SUBNET_A, Ip: ip }, { SubnetId: SUBNET_B }]),
        `expected ${JSON.stringify(ip)} to be accepted`,
      ).toBeNull();
    }
    expect(rejection([{ SubnetId: SUBNET_A }, { SubnetId: SUBNET_B }])).toBeNull();
  });

  it("accepts more than two addresses, one subnet or many", () => {
    expect(
      rejection([
        { SubnetId: SUBNET_A, Ip: "172.31.0.10" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
        { SubnetId: SUBNET_A, Ip: "172.31.0.11" },
        { SubnetId: SUBNET_A },
      ]),
    ).toBeNull();
  });

  it("accepts a well-formed IPv6 address and leaves the CIDR rule to the emulator", () => {
    // A valid IPv6 is a shape the emulator understands, so it must get its own
    // 400 ("not in subnet ... CIDR range") rather than this route's shape error.
    expect(
      rejection([
        { SubnetId: SUBNET_A, Ip: "2001:db8::1" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10" },
      ]),
    ).toBeNull();
  });

  it("accepts a valid address that is out of the subnet's CIDR, which the emulator owns", () => {
    // The emulator answers this with a specific 400 about the subnet it was
    // paired with. Copying the CIDR check here would need the subnet's block and
    // would risk refusing an address the emulator would have created.
    expect(
      rejection([
        { SubnetId: SUBNET_A, Ip: "192.168.99.5" },
        { SubnetId: "subnet-does-not-exist", Ip: "10.0.0.5" },
      ]),
    ).toBeNull();
  });

  it("ignores the fields it has no rule for, such as Ipv6", () => {
    expect(
      rejection([
        { SubnetId: SUBNET_A, Ipv6: "2001:db8::1" },
        { SubnetId: SUBNET_B, Ip: "172.31.16.10", Extra: "ignored" },
      ]),
    ).toBeNull();
  });
});

describe("isIpv4Address", () => {
  it("accepts dotted quads, including the ends of the range", () => {
    for (const value of ["0.0.0.0", "172.31.0.10", "255.255.255.255", "10.0.0.255"]) {
      expect(isIpv4Address(value)).toBe(true);
    }
  });

  it("rejects what the emulator's IPv4 parser would not read", () => {
    for (const value of [
      "",
      "not-an-ip",
      "172.31.0",
      "172.31.0.1.2",
      "256.0.0.1",
      "172.31.0.256",
      "172.31.0.-1",
      "010.1.1.1",
      "2001:db8::1",
      "172.31.0.1/24",
      " 172.31.0.10",
      "172.31.0.010",
    ]) {
      expect(isIpv4Address(value), `expected ${JSON.stringify(value)} to be refused`).toBe(false);
    }
  });
});

describe("isIpAddress", () => {
  it("accepts the IPv6 forms Route 53 documents", () => {
    for (const value of [
      "::",
      "::1",
      "2001:db8::1",
      "2001:0db8:0000:0000:0000:0000:0000:0001",
      "fe80::",
      "2001:db8:0:0:1:0:0:1",
      "1:2:3:4:5:6:7:8",
      "1:2:3:4:5:6:7::",
      "::ffff:192.0.2.1",
      "2001:db8::1.2.3.4",
      "::2:3:4:5:6:7:8",
    ]) {
      expect(isIpAddress(value), `expected ${value} to be accepted`).toBe(true);
    }
  });

  it("refuses malformed IPv6 rather than passing it to a parser that throws", () => {
    for (const value of [
      "",
      ":",
      ":::",
      ":1:2:3",
      "1:2:3:4:5:6:7:8:9",
      "1:2:3:4:5:6:7:8::",
      "1::2::3",
      "1:2:::3",
      "2001:db8::1::",
      "2001:db8::1%eth0",
      "2001:db8::12345",
      "2001:db8::gggg",
      "2001:db8::1/64",
      "::1.2.3.4.5",
      "::ffff:999.0.2.1",
    ]) {
      expect(isIpAddress(value), `expected ${JSON.stringify(value)} to be refused`).toBe(false);
    }
  });

  it("accepts an IPv4 address too, because the rule covers both families", () => {
    for (const value of ["172.31.0.10", "255.255.255.255"]) {
      expect(isIpAddress(value)).toBe(true);
    }
  });
});
