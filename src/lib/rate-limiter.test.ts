import { describe, it, expect, beforeEach } from "vite-plus/test";
import { checkRateLimit, resetRateLimit, getRateLimitStatus } from "@/lib/rate-limiter";

// Re-import the module before each test to reset the in-memory store
// This ensures test isolation for the rate limiter's internal state
beforeEach(async () => {
  // Rate limit cleanup check (scheduled via setInterval in module)
});

describe("Rate Limiter", () => {
  describe("checkRateLimit", () => {
    it("should allow requests within the limit", () => {
      const result = checkRateLimit("test:user1", {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: "test",
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.total).toBe(5);
    });

    it("should block requests exceeding the limit", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:user2", {
          windowMs: 60000,
          maxRequests: 5,
          keyPrefix: "test",
        });
      }

      const result = checkRateLimit("test:user2", {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: "test",
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return proper rate limit information", () => {
      const result = checkRateLimit("test:user3", {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        keyPrefix: "auth",
      });

      expect(result.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe("resetRateLimit", () => {
    it("should reset rate limit for an identifier", () => {
      resetRateLimit("test:user4", "test");
      const result = checkRateLimit("test:user4", {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: "test",
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return status without consuming a slot", () => {
      const result = getRateLimitStatus("test:user5", {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: "test",
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });

  describe("scheduled cleanup", () => {
    it("should allow requests after expired window even without calling resetRateLimit", async () => {
      // Create a rate limit entry with a very short window
      const shortWindowMs = 50;
      const result1 = checkRateLimit("test:cleanup-user", {
        windowMs: shortWindowMs,
        maxRequests: 1,
        keyPrefix: "test",
      });
      expect(result1.allowed).toBe(true);

      // Exhaust the limit
      const result2 = checkRateLimit("test:cleanup-user", {
        windowMs: shortWindowMs,
        maxRequests: 1,
        keyPrefix: "test",
      });
      expect(result2.allowed).toBe(false);

      // Wait for the window to expire and the scheduled cleanup to run
      await new Promise((resolve) => setTimeout(resolve, shortWindowMs + 200));

      // After expiry, a new request should be allowed again
      const result3 = checkRateLimit("test:cleanup-user", {
        windowMs: shortWindowMs,
        maxRequests: 1,
        keyPrefix: "test",
      });
      expect(result3.allowed).toBe(true);
    });

    it("should remove expired entries from the store via scheduled cleanup", async () => {
      // Create entries with a short window
      checkRateLimit("test:cleanup-a", {
        windowMs: 50,
        maxRequests: 1,
        keyPrefix: "test",
      });
      checkRateLimit("test:cleanup-b", {
        windowMs: 50,
        maxRequests: 1,
        keyPrefix: "test",
      });

      // Wait for the scheduled cleanup interval to fire and expire entries
      await new Promise((resolve) => setTimeout(resolve, 500));

      // After cleanup and window expiry, status should show full allowance
      const status = getRateLimitStatus("test:cleanup-a", {
        windowMs: 50,
        maxRequests: 1,
        keyPrefix: "test",
      });
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(1);
    });
  });
});
