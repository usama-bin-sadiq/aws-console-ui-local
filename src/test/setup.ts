/**
 * Vitest Test Setup
 * Global test configuration, mocks, and utilities
 */

import { vi } from "vite-plus/test";

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
const eventListeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(handler as EventListenerOrEventListenerObject);
});
vi.spyOn(window, "removeEventListener").mockImplementation((event, handler) => {
  eventListeners.get(event)?.delete(handler as EventListenerOrEventListenerObject);
});

// Clean up after each test
import { afterEach } from "vite-plus/test";
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  eventListeners.clear();
});

// Extend matchers
import { expect } from "vite-plus/test";

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
  // Signature must match vitest's own `Assertion<R, T>` (R defaults to void,
  // T to unknown) or TS rejects the augmentation with TS2428.
  interface Assertion<R = void, T = unknown> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}
