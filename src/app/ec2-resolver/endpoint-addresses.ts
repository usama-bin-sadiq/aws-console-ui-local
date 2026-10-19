/**
 * Address rules for the create-resolver-endpoint form.
 *
 * `CreateResolverEndpoint` cannot be called with an empty `IpAddresses` list.
 * The AWS API reference for the field says: "Even though the minimum is 1,
 * Route 53 requires that you create at least two", and the emulator enforces
 * the same rule ("Resolver endpoint needs to have at least 2 IP addresses").
 * The form used to send a name and nothing else, so every attempt failed and
 * the modal closed as if it had worked.
 *
 * Each entry of `IpAddresses` is an `IpAddressRequest`:
 *
 *   - `SubnetId` is required. Without it the emulator answers with an opaque
 *     500 about a missing 'SubnetId', and an id it does not know is rejected
 *     with "The subnet ID ... does not exist". An endpoint is a set of
 *     addresses inside a VPC, so the form has to ask for the subnets too.
 *   - `Ip` is optional. Left out, Route 53 (and the emulator) takes a free
 *     address from the subnet. Given, it has to be an IPv4 address inside that
 *     subnet's CIDR block: the emulator rejects anything else, and a value it
 *     cannot parse at all comes back as a 500 instead of a usable message.
 *
 * These rules are deliberately no stricter than the emulator. There is no upper
 * bound on the number of addresses, and an address that is inside the subnet's
 * CIDR is accepted even where the emulator may still refuse the individual host
 * (Route 53 reserves the first addresses of every subnet): the emulator's own
 * message is clearer than a browser-side guess at which hosts are reserved.
 */

/** A row of the address editor: a subnet, and optionally the address to use. */
export interface AddressDraft {
  subnetId: string;
  ip: string;
}

/** The parts of a `Subnet` this form needs, straight from DescribeSubnets. */
export interface SubnetSummary {
  SubnetId?: string;
  VpcId?: string;
  CidrBlock?: string;
  AvailabilityZone?: string;
}

/** Per-row field errors, keyed the way the form fields are labelled. */
export interface AddressFieldErrors {
  subnetId?: string;
  ip?: string;
}

/** Minimum `IpAddresses` length Route 53 accepts, whatever the API minimum is. */
export const MIN_ENDPOINT_ADDRESSES = 2;

/** A blank row, so a fresh form starts with the minimum the API allows. */
export function emptyAddress(): AddressDraft {
  return { subnetId: "", ip: "" };
}

// Dotted quad with no leading zeros, which is what the emulator's IPv4 parser
// accepts: "010.1.1.1" is a different address there, not this one.
const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function isIpv4Address(value: string): boolean {
  return IPV4_PATTERN.test(value.trim());
}

function toIpv4Number(value: string | undefined): number | null {
  if (value === undefined || !isIpv4Address(value)) return null;
  const octets = value.trim().split(".").map(Number);
  return (octets[0] * 0x1000000 + octets[1] * 0x10000 + octets[2] * 0x100 + octets[3]) >>> 0;
}

/**
 * Whether an address can be shown to sit inside a subnet's CIDR block.
 *
 * Returns false only when containment can be disproved. A subnet whose CIDR is
 * missing or unreadable proves nothing, and a form that blocks input it cannot
 * check would reject requests the emulator accepts.
 */
export function isAddressInSubnetCidr(ip: string, cidr: string | undefined): boolean {
  const [network, prefix] = (cidr ?? "").split("/");
  const address = toIpv4Number(ip);
  const base = toIpv4Number(network);
  const bits = Number(prefix);
  if (address === null || base === null || !Number.isInteger(bits) || bits < 0 || bits > 32) {
    return true;
  }
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (address & mask) === (base & mask);
}

export interface AddressValidation {
  /** One entry per row, in the same order as the drafts. */
  rowErrors: AddressFieldErrors[];
  /** Whole-list message, e.g. too few addresses to create an endpoint at all. */
  formError?: string;
  valid: boolean;
}

export function validateEndpointAddresses(
  drafts: AddressDraft[],
  subnets: SubnetSummary[] = [],
): AddressValidation {
  const rowErrors: AddressFieldErrors[] = drafts.map((draft) => {
    const errors: AddressFieldErrors = {};
    const subnetId = draft.subnetId.trim();
    const ip = draft.ip.trim();

    if (!subnetId) {
      errors.subnetId = "Select a subnet";
    }

    // An empty address is not an error: Route 53 picks one from the subnet.
    if (ip && !isIpv4Address(ip)) {
      errors.ip = "Enter a valid IPv4 address, for example 172.31.0.10";
    } else if (ip && subnetId) {
      const subnet = subnets.find((candidate) => candidate.SubnetId === subnetId);
      if (subnet && !isAddressInSubnetCidr(ip, subnet.CidrBlock)) {
        errors.ip = `The address must be inside the subnet's CIDR range (${subnet.CidrBlock})`;
      }
    }

    return errors;
  });

  const hasRowErrors = rowErrors.some((errors) => Object.keys(errors).length > 0);
  const formError =
    drafts.length < MIN_ENDPOINT_ADDRESSES
      ? `A resolver endpoint needs at least ${MIN_ENDPOINT_ADDRESSES} IP addresses`
      : undefined;

  return { rowErrors, formError, valid: !formError && !hasRowErrors };
}

/** The `IpAddressRequest[]` payload the API route forwards to Route 53. */
export function toIpAddresses(drafts: AddressDraft[]): Array<{ SubnetId: string; Ip?: string }> {
  return drafts.map((draft) => {
    const SubnetId = draft.subnetId.trim();
    const Ip = draft.ip.trim();
    return Ip ? { SubnetId, Ip } : { SubnetId };
  });
}
