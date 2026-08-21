import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number; // timestamp ms
}

// Global Map for in-memory rate limiting across single-instance deployment
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

/**
  Checks and increments request count for a given key.
  Returns whether the request is allowed and remaining retry seconds if limited.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now >= record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  record.count += 1;
  const remaining = Math.max(0, maxAttempts - record.count);
  return { allowed: true, remaining, retryAfterSeconds: 0 };
}

/**
  Increments failure count specifically (e.g. for failed login attempts).
 */
export function recordFailure(
  key: string,
  windowSeconds: number
): { count: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now >= record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return { count: 1, retryAfterSeconds: windowSeconds };
  }

  record.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  return { count: record.count, retryAfterSeconds };
}

/**
  Inspects current failure count without mutating.
 */
export function getFailureCount(
  key: string
): { count: number; isBlocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now >= record.resetTime) {
    return { count: 0, isBlocked: false, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  return { count: record.count, isBlocked: record.count >= 5, retryAfterSeconds };
}

/**
  Resets the counter for a given key (e.g. on successful login).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
