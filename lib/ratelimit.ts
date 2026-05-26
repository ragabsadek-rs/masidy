interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store[key];

  if (!entry || now > entry.resetAt) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }

  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  return false;
}

export function getRateLimitKey(userId: string, endpoint: string): string {
  return `${endpoint}:${userId}`;
}

export function getTimeUntilReset(key: string): number {
  const entry = store[key];
  if (!entry) return 0;
  return Math.max(0, entry.resetAt - Date.now());
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (now > store[key].resetAt) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);
