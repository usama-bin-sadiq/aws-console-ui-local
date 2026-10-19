import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Route53ResolverPage from "./page";

/**
 * The create form on /ec2-resolver used to send a name and nothing else, so
 * every attempt was refused by Route 53 for a reason the user never saw. These
 * cases cover the wiring rather than the rules themselves (see
 * endpoint-addresses.test.ts): the address editor is on the page at all, and a
 * request the emulator would refuse is stopped in the browser instead of being
 * sent.
 *
 * Choosing a subnet in the dropdown is not covered here. Cloudscape's Select
 * opens on mousedown and selects through a window-level mouse-down target that
 * jsdom does not deliver, so there is no event sequence that picks an option in
 * this environment; the payload those rows produce is covered by
 * endpoint-addresses.test.ts and, against the live emulator, by the API check.
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

const SUBNETS = [
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

function mockApi(): void {
  apiFetch.mockImplementation((url: string, init?: RequestInit) => {
    if (url === "/api/subnet") return Promise.resolve(jsonResponse({ subnets: SUBNETS }));
    if (init?.method === "POST") return Promise.resolve(jsonResponse({ success: true }));
    return Promise.resolve(jsonResponse({ endpoints: [] }));
  });
}

function createCalls(): Array<Record<string, unknown>> {
  return apiFetch.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
    .map(([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, unknown>);
}

async function openCreateModal(): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: "Create endpoint" }));
  await screen.findByText("IP addresses");
  // Cloudscape's Modal renders its content a tick after it becomes visible.
  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: /Select a subnet/ }).length).toBeGreaterThan(0),
  );
}

describe("create resolver endpoint form", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    mockApi();
  });

  it("opens with one subnet and address row per required address", async () => {
    render(<Route53ResolverPage />);
    await openCreateModal();

    expect(screen.getAllByRole("button", { name: /Select a subnet/ })).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("172.31.0.10")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Add IP address" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
  });

  it("says so when the emulator has no subnet to take an address from", async () => {
    apiFetch.mockImplementation((url: string) =>
      Promise.resolve(
        url === "/api/subnet" ? jsonResponse({ subnets: [] }) : jsonResponse({ endpoints: [] }),
      ),
    );

    render(<Route53ResolverPage />);
    await openCreateModal();

    await screen.findByText(/this account has none/);
  });

  it("stops a form with fewer than two addresses from being sent", async () => {
    render(<Route53ResolverPage />);
    await openCreateModal();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(screen.getAllByPlaceholderText("172.31.0.10")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("A resolver endpoint needs at least 2 IP addresses")).toBeTruthy();
    expect(createCalls()).toEqual([]);
  });

  it("stops a malformed address from being sent and says why", async () => {
    render(<Route53ResolverPage />);
    await openCreateModal();

    fireEvent.change(screen.getAllByPlaceholderText("172.31.0.10")[0], {
      target: { value: "not-an-ip" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("Enter a valid IPv4 address, for example 172.31.0.10");
    // The row is also missing its subnet, and that is reported on the field.
    expect(screen.getAllByText("Select a subnet").length).toBeGreaterThan(0);
    expect(createCalls()).toEqual([]);
  });

  it("clears a field's message as soon as that field is edited", async () => {
    render(<Route53ResolverPage />);
    await openCreateModal();

    fireEvent.change(screen.getAllByPlaceholderText("172.31.0.10")[0], {
      target: { value: "not-an-ip" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByText("Enter a valid IPv4 address, for example 172.31.0.10");

    fireEvent.change(screen.getAllByPlaceholderText("172.31.0.10")[0], {
      target: { value: "172.31.0.10" },
    });

    await waitFor(() =>
      expect(screen.queryByText("Enter a valid IPv4 address, for example 172.31.0.10")).toBeNull(),
    );
  });
});
