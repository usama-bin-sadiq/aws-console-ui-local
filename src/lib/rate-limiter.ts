/**
 * In-memory rate limiter for API endpoints.
 * For production, replace with Redis-based implementation.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyPrefix?: string;    // Prefix for rate limit keys
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

/**
 * Check and consume a rate limit slot.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const key = `${options.keyPrefix || 'ratelimit'}:${identifier}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: newEntry.resetTime,
      total: options.maxRequests,
    };
  }

  if (entry.count >= options.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      total: options.maxRequests,
    };
  }

  // Increment and allow
  entry.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
    total: options.maxRequests,
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful auth).
 */
export function resetRateLimit(identifier: string, keyPrefix?: string): void {
  const key = `${keyPrefix || 'ratelimit'}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without consuming a slot.
 */
export function getRateLimitStatus(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const key = `${options.keyPrefix || 'ratelimit'}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    return {
      allowed: true,
      remaining: options.maxRequests,
      resetTime: now + options.windowMs,
      total: options.maxRequests,
    };
  }

  return {
    allowed: entry.count < options.maxRequests,
    remaining: Math.max(0, options.maxRequests - entry.count),
    resetTime: entry.resetTime,
    total: options.maxRequests,
  };
}