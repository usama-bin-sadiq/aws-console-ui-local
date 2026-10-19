/**
 * Request-shape rules for the `IpAddresses` list of `CreateResolverEndpoint`.
 *
 * The route is reachable by any caller, so the shape of each entry has to be
 * settled before the list is forwarded. Two malformed shapes make the emulator
 * raise a Python exception instead of reporting a client error, which reaches
 * the browser as a degraded-adapter 5xx: a user is told the emulator is broken
 * over input they typed.
 *
 * Measured against the emulator (v1.2.0, community edition), because the
 * failure depends on the entry shape and not on any state:
 *
 *   - `SubnetId` absent            -> 500 "...: 'SubnetId'"      (KeyError while
 *                                    the emulator validates subnet id lengths)
 *   - `SubnetId` null              -> 500 "...: object of type 'NoneType' has no len()"
 *   - `Ip` unparseable             -> 500 "...: 'not-an-ip' does not appear to be
 *                                    an IPv4 or IPv6 address"
 *   - entry is a bare string       -> 500 "Invalid type when parsing IpAddressRequest"
 *   - entry is null                -> 500 "...: 'NoneType' object is not subscriptable"
 *
 * Three neighbouring rules are the emulator's own and stay there, because they
 * need state this route has no business duplicating, and a second copy could
 * only ever reject something the emulator would have accepted:
 *
 *   - fewer than two entries       -> 400 "Resolver endpoint needs to have at least 2
 *                                    IP addresses" (also caught here, so the caller
 *                                    is told before a round trip)
 *   - unknown `SubnetId`           -> 400 "The subnet ID ... does not exist"
 *   - `Ip` outside the subnet CIDR -> 400 "IP address ... is either not in subnet ...
 *                                    CIDR range or is reserved"
 *
 * `Ip` is deliberately optional. The emulator treats an absent, null or empty
 * `Ip` as "choose a free address in this subnet" and creates the endpoint, so
 * requiring it would reject a request that works.
 */

/** Minimum `IpAddresses` length Route 53 accepts, whatever the API minimum is. */
export const MIN_ENDPOINT_ADDRESSES = 2;

/** The 400 body the route returns, matching its other shape failures. */
export interface IpAddressesRejection {
  error: string;
  message: string;
}

// Dotted quad with no leading zeros, which is what the emulator's IPv4 parser
// accepts: "010.1.1.1" is a different address there, not this one.
const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const HEXTET_PATTERN = /^[0-9a-fA-F]{1,4}$/;

export function isIpv4Address(value: string): boolean {
  return IPV4_PATTERN.test(value);
}

/**
 * Whether a value is a dotted quad or an IPv6 address, with no prefix length.
 *
 * Split on "::" and count the groups either side, so a malformed address is
 * refused for the same reason the emulator's parser would refuse it. A zone
 * suffix ("fe80::1%eth0") is refused too: Python reads one, but a scoped
 * address is not something Route 53 will bind an endpoint to.
 */
function isIpv6Address(value: string): boolean {
  if (value.includes("%")) return false;

  const halves = value.split("::");
  if (halves.length > 2) return false;

  // The single half of an uncompressed address may not begin or end with a
  // lone ":". An empty half is only legal next to a "::".
  const parseHalf = (half: string, compressed: boolean): string[] | null => {
    if (half === "") return compressed ? [] : null;
    if (half.startsWith(":") || half.endsWith(":")) return null;
    return half.split(":");
  };

  const left = parseHalf(halves[0], halves.length === 2);
  if (left === null) return false;
  const right = halves.length === 2 ? parseHalf(halves[1], true) : [];
  if (right === null) return false;

  // An embedded IPv4 tail ("::ffff:192.0.2.1") is the last two groups.
  const groups = [...left, ...right];
  const last = groups.length - 1;
  let count = groups.length;
  for (const [index, group] of groups.entries()) {
    if (index === last && group.includes(".")) {
      if (!isIpv4Address(group)) return false;
      count += 1;
    } else if (!HEXTET_PATTERN.test(group)) {
      return false;
    }
  }

  return halves.length === 2 ? count <= 7 : count === 8;
}

export function isIpAddress(value: string): boolean {
  return isIpv4Address(value) || isIpv6Address(value);
}

/** An `IpAddressRequest` is a JSON object; a string or null in that slot is not. */
function isAddressRequest(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Names a value in a message without pasting an arbitrary blob of caller input. */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (typeof value === "string") return `the string ${JSON.stringify(value.slice(0, 32))}`;
  return `a ${typeof value}`;
}

/**
 * The 400 to return for `IpAddresses`, or null when the list can be forwarded.
 *
 * The first bad entry is reported rather than every one of them, because a
 * caller fixing a list needs the earliest reason it was refused, and the
 * emulator would only ever see the request after all of them were corrected.
 */
export function validateIpAddresses(entries: unknown): IpAddressesRejection | null {
  if (!Array.isArray(entries) || entries.length < MIN_ENDPOINT_ADDRESSES) {
    return {
      error: `IpAddresses is required and must contain at least ${MIN_ENDPOINT_ADDRESSES} addresses`,
      message: `A resolver endpoint needs at least ${MIN_ENDPOINT_ADDRESSES} IP addresses from subnets in the same VPC.`,
    };
  }

  for (const [index, entry] of entries.entries()) {
    const at = `IpAddresses entry ${index + 1}`;

    if (!isAddressRequest(entry)) {
      return {
        error: `${at} must be an object with a SubnetId`,
        message: `Every address in IpAddresses must be an object carrying the SubnetId it belongs to, and ${at} is ${describe(entry)}.`,
      };
    }

    const subnetId = entry.SubnetId;
    if (typeof subnetId !== "string" || !subnetId.trim()) {
      return {
        error: `${at} is missing SubnetId`,
        message: `${at} needs a SubnetId: the subnet the endpoint address is placed in.`,
      };
    }

    const ip = entry.Ip;
    // Absent, null and "" all mean "pick a free address in this subnet", which is
    // what the emulator does, so only a value that is actually there is judged.
    if (ip === undefined || ip === null || ip === "") continue;

    if (typeof ip !== "string") {
      return {
        error: `${at} has an Ip that is not a string`,
        message: `The Ip in ${at} must be an IPv4 or IPv6 address written as a string, not ${describe(ip)}. Leave it out to let Route 53 choose a free address in the subnet.`,
      };
    }

    // The address is judged exactly as written. The emulator's parser does not
    // tolerate surrounding whitespace, so trimming here would mean rewriting the
    // forwarded value, and a blank-but-not-empty "Ip" is the 500 this is for.
    if (!isIpAddress(ip)) {
      return {
        error: `${at} has an invalid Ip: '${ip}'`,
        message: `'${ip}' is not a valid IPv4 or IPv6 address, so ${at} cannot be sent to Route 53. Leave the Ip out of ${at} to let Route 53 choose a free address in the subnet.`,
      };
    }
  }

  return null;
}
