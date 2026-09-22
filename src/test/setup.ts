/**
 * Vitest Test Setup
 * Global test configuration, mocks, and utilities
 */

import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}));

// Mock better-sqlite3 for unit tests
vi.mock("better-sqlite3", () => {
  const mockDb = {
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    })),
    exec: vi.fn(),
    pragma: vi.fn(),
    close: vi.fn(),
  };
  return {
    default: vi.fn(() => mockDb),
  };
});

// Mock bcryptjs for unit tests
vi.mock("bcryptjs", () => ({
  hashSync: vi.fn((password: string) => `hashed_${password}`),
  compareSync: vi.fn((password: string, hash: string) => hash === `hashed_${password}`),
  genSaltSync: vi.fn(),
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Mock otplib for MFA tests
vi.mock("otplib", () => ({
  authenticator: {
    generateSecret: vi.fn(() => "JBSWY3DPEHPK3PXP"),
    generate: vi.fn(() => "123456"),
    check: vi.fn(() => true),
    verify: vi.fn(() => true),
  },
}));

// Mock qrcode
vi.mock("qrcode", () => ({
  toDataURL: vi.fn(() => Promise.resolve("data:image/png;base64,mock")),
}));

// Mock localStorage for hooks tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });

// Mock window.addEventListener/removeEventListener for hooks
const eventListeners = new Map<string, Set<Function>>();
vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(handler as Function);
});
vi.spyOn(window, "removeEventListener").mockImplementation((event, handler) => {
  eventListeners.get(event)?.delete(handler as Function);
});

// Clean up after each test
import { afterEach } from "vitest";
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  eventListeners.clear();
});

// Extend matchers
import { expect } from "vitest";

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? "not " : ""}to be within range ${floor} - ${ceiling}`,
    };
  },
});

declare module "vitest" {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
  }
}