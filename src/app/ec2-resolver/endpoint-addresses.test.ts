import { describe, expect, it } from "vite-plus/test";
import {
  AddressDraft,
  MIN_ENDPOINT_ADDRESSES,
  SubnetSummary,
  emptyAddress,
  isAddressInSubnetCidr,
  isIpv4Address,
  toIpAddresses,
  validateEndpointAddresses,
} from "./endpoint-addresses";

/**
 * The rule that made /ec2-resolver unable to create an endpoint: the form sent
 * a name and no `IpAddresses`, and Route 53 requires at least two. These cases
 * pin the browser-side rules to what the API route and the emulator accept, so
 * a form change cannot quietly start sending a request that is certain to fail
 * (or start refusing one the emulator would have created).
 */

const SUBNETS: SubnetSummary[] = [
  {
    SubnetId: "subnet-aaaa",
    VpcId: "vpc-1",
    CidrBlock: "172.31.0.0/20",
    AvailabilityZone: "us-east-1a",
  },
  {
    SubnetId: "subnet-bbbb",
    VpcId: "vpc-1",
    CidrBlock: "172.31.16.0/20",
    AvailabilityZone: "us-east-1b",
  },
];

function drafts(...rows: Array<[string, string]>): AddressDraft[] {
  return rows.map(([subnetId, ip]) => ({ subnetId, ip }));
}

describe("validateEndpointAddresses", () => {
  it("rejects fewer than two addresses, whatever else is filled in", () => {
    expect(MIN_ENDPOINT_ADDRESSES).toBe(2);
    for (const rows of [[], [emptyAddress()], drafts(["subnet-aaaa", "172.31.0.10"])]) {
      const result = validateEndpointAddresses(rows, SUBNETS);
      expect(result.valid).toBe(false);
      expect(result.formError).toBe("A resolver endpoint needs at least 2 IP addresses");
    }
  });

  it("accepts two addresses, one subnet each", () => {
    const result = validateEndpointAddresses(
      drafts(["subnet-aaaa", "172.31.0.10"], ["subnet-bbbb", "172.31.16.10"]),
      SUBNETS,
    );
    expect(result).toEqual({ rowErrors: [{}, {}], formError: undefined, valid: true });
  });

  it("accepts more than two addresses", () => {
    const result = validateEndpointAddresses(
      [
        ...drafts(["subnet-aaaa", "172.31.0.10"], ["subnet-bbbb", "172.31.16.10"]),
        ...drafts(["subnet-aaaa", "172.31.0.11"], ["subnet-bbbb", "172.31.16.11"]),
      ],
      SUBNETS,
    );
    expect(result.valid).toBe(true);
    expect(result.rowErrors).toHaveLength(4);
  });

  it("accepts addresses left blank, because Route 53 picks one from the subnet", () => {
    const result = validateEndpointAddresses(
      drafts(["subnet-aaaa", ""], ["subnet-bbbb", "   "]),
      SUBNETS,
    );
    expect(result).toEqual({ rowErrors: [{}, {}], formError: undefined, valid: true });
  });

  it("requires a subnet on every row", () => {
    const result = validateEndpointAddresses(
      drafts(["subnet-aaaa", "172.31.0.10"], ["", "172.31.16.10"]),
      SUBNETS,
    );
    expect(result.valid).toBe(false);
    expect(result.formError).toBeUndefined();
    expect(result.rowErrors[0].subnetId).toBeUndefined();
    expect(result.rowErrors[1].subnetId).toBe("Select a subnet");
  });

  it("reports a blank row as needing both a subnet and nothing else", () => {
    const result = validateEndpointAddresses([emptyAddress(), emptyAddress()], SUBNETS);
    expect(result.rowErrors).toEqual([
      { subnetId: "Select a subnet" },
      { subnetId: "Select a subnet" },
    ]);
  });

  it("rejects malformed addresses and names the row", () => {
    const result = validateEndpointAddresses(
      [
        ...drafts(["subnet-aaaa", "not-an-ip"]),
        ...drafts(["subnet-bbbb", "172.31.16.10"]),
        ...drafts(["subnet-aaaa", "172.31.0.999"]),
        ...drafts(["subnet-aaaa", "172.31.0.010"]),
        ...drafts(["subnet-aaaa", "172.31.0"]),
        ...drafts(["subnet-aaaa", "172.31.0.10.5"]),
        ...drafts(["subnet-aaaa", " 172.31.0.10 "]),
      ],
      SUBNETS,
    );
    expect(result.valid).toBe(false);
    expect(result.rowErrors[0].ip).toBe("Enter a valid IPv4 address, for example 172.31.0.10");
    expect(result.rowErrors[1]).toEqual({});
    for (const index of [2, 3, 4, 5]) {
      expect(result.rowErrors[index].ip).toBe(
        "Enter a valid IPv4 address, for example 172.31.0.10",
      );
    }
    // Surrounding whitespace is trimmed rather than treated as malformed.
    expect(result.rowErrors[6]).toEqual({});
  });

  it("rejects an address that is outside the subnet it is paired with", () => {
    const result = validateEndpointAddresses(
      drafts(["subnet-aaaa", "192.168.99.5"], ["subnet-bbbb", "172.31.0.10"]),
      SUBNETS,
    );
    expect(result.valid).toBe(false);
    expect(result.rowErrors[0].ip).toBe(
      "The address must be inside the subnet's CIDR range (172.31.0.0/20)",
    );
    expect(result.rowErrors[1].ip).toBe(
      "The address must be inside the subnet's CIDR range (172.31.16.0/20)",
    );
  });

  it("cannot disprove containment when the subnet's CIDR is unknown", () => {
    const result = validateEndpointAddresses(
      drafts(["subnet-unknown", "172.31.0.10"], ["subnet-also-unknown", "10.9.9.9"]),
      SUBNETS,
    );
    expect(result.valid).toBe(true);
  });

  it("validates the address shape even with no subnets loaded at all", () => {
    const result = validateEndpointAddresses(
      drafts(["subnet-aaaa", "not-an-ip"], ["subnet-bbbb", "172.31.16.10"]),
    );
    expect(result.valid).toBe(false);
    expect(result.rowErrors[0].ip).toBe("Enter a valid IPv4 address, for example 172.31.0.10");
    expect(result.rowErrors[1]).toEqual({});
  });
});

describe("isIpv4Address", () => {
  it("accepts dotted quads, including the ends of the range", () => {
    for (const value of ["0.0.0.0", "172.31.0.10", "255.255.255.255", "10.0.0.255"]) {
      expect(isIpv4Address(value)).toBe(true);
    }
  });

  it("rejects anything the emulator's IPv4 parser would not read", () => {
    for (const value of [
      "",
      "not-an-ip",
      "172.31.0",
      "172.31.0.1.2",
      "256.0.0.1",
      "172.31.0.-1",
      "172.31.0.256",
      "010.1.1.1",
      "2001:db8::1",
      "172.31.0.1/24",
    ]) {
      expect(isIpv4Address(value)).toBe(false);
    }
  });
});

describe("isAddressInSubnetCidr", () => {
  it("accepts an address inside the block and rejects one outside", () => {
    expect(isAddressInSubnetCidr("172.31.0.10", "172.31.0.0/20")).toBe(true);
    expect(isAddressInSubnetCidr("172.31.15.255", "172.31.0.0/20")).toBe(true);
    expect(isAddressInSubnetCidr("172.31.16.10", "172.31.0.0/20")).toBe(false);
    expect(isAddressInSubnetCidr("10.0.0.1", "172.31.0.0/20")).toBe(false);
  });

  it("handles a single-host block and a /32", () => {
    expect(isAddressInSubnetCidr("172.31.0.7", "172.31.0.7/32")).toBe(true);
    expect(isAddressInSubnetCidr("172.31.0.8", "172.31.0.7/32")).toBe(false);
  });

  it("treats an unreadable block as no evidence against the address", () => {
    for (const cidr of [
      undefined,
      "",
      "172.31.0.0",
      "172.31.0.0/",
      "not-a-cidr/20",
      "172.31.0.0/33",
    ]) {
      expect(isAddressInSubnetCidr("172.31.0.10", cidr)).toBe(true);
    }
  });
});

describe("toIpAddresses", () => {
  it("builds the IpAddressRequest list the API route forwards", () => {
    expect(
      toIpAddresses(
        drafts(
          ["subnet-aaaa", "172.31.0.10"],
          ["subnet-bbbb", ""],
          [" subnet-cccc ", " 10.0.0.5 "],
        ),
      ),
    ).toEqual([
      { SubnetId: "subnet-aaaa", Ip: "172.31.0.10" },
      { SubnetId: "subnet-bbbb" },
      { SubnetId: "subnet-cccc", Ip: "10.0.0.5" },
    ]);
  });

  it("omits the address entirely when it is blank, so the emulator picks one", () => {
    expect(toIpAddresses(drafts(["subnet-aaaa", "  "]))).toEqual([{ SubnetId: "subnet-aaaa" }]);
    expect(JSON.stringify(toIpAddresses(drafts(["subnet-aaaa", ""])))).not.toContain("Ip");
  });
});
