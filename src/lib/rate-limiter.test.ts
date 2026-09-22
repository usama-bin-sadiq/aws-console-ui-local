import { describe, it, expect } from 'vitest';
import { checkRateLimit, resetRateLimit, getRateLimitStatus } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within the limit', () => {
      const result = checkRateLimit('test:user1', {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.total).toBe(5);
    });

    it('should block requests exceeding the limit', () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test:user2', {
          windowMs: 60000,
          maxRequests: 5,
          keyPrefix: 'test',
        });
      }

      const result = checkRateLimit('test:user2', {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return proper rate limit information', () => {
      const result = checkRateLimit('test:user3', {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        keyPrefix: 'auth',
      });

      expect(result.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for an identifier', () => {
      resetRateLimit('test:user4', 'test');
      const result = checkRateLimit('test:user4', {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status without consuming a slot', () => {
      const result = getRateLimitStatus('test:user5', {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });
});