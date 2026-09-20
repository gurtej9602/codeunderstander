/**
 * rateLimiter.js
 * 
 * In-memory rate limiting middleware designed to stay strictly within
 * the Google Gemini Free Tier limits:
 * - Minimum 5-second interval between requests per IP/user.
 * - Global requests-per-minute (RPM) tracker (Gemini Free tier is capped at 15 RPM).
 */

const MIN_INTERVAL_MS = 5000; // 5 seconds cooldown per user
const MAX_REQUESTS_PER_MINUTE = 14; // Conservative ceiling below 15 RPM

// In-memory store for client timestamps: { [ip: string]: lastRequestTimestamp }
const userLastRequest = new Map();

// In-memory sliding window request timestamps for global RPM
const globalRequestTimestamps = [];

/**
 * Cleanup old records periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  // Clear user records older than 1 minute
  for (const [ip, time] of userLastRequest.entries()) {
    if (now - time > 60000) {
      userLastRequest.delete(ip);
    }
  }

  // Clear global timestamps older than 60 seconds
  while (globalRequestTimestamps.length > 0 && now - globalRequestTimestamps[0] > 60000) {
    globalRequestTimestamps.shift();
  }
}, 30000);

/**
 * Express middleware for free-tier rate limiting.
 */
function freeTierRateLimiter(req, res, next) {
  const now = Date.now();
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';

  // 1. Check Per-User Cooldown (5-second throttle)
  const lastTime = userLastRequest.get(clientIp);
  if (lastTime) {
    const elapsed = now - lastTime;
    if (elapsed < MIN_INTERVAL_MS) {
      const waitSeconds = Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSeconds}s before submitting another review to stay within free-tier quotas.`,
        retryAfter: waitSeconds,
        isRateLimit: true
      });
    }
  }

  // 2. Check Global RPM Quota (Gemini Free Tier ~ 15 RPM)
  // Prune timestamps older than 60s
  while (globalRequestTimestamps.length > 0 && now - globalRequestTimestamps[0] > 60000) {
    globalRequestTimestamps.shift();
  }

  if (globalRequestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestInWindow = globalRequestTimestamps[0];
    const waitSeconds = Math.ceil((60000 - (now - oldestInWindow)) / 1000);
    return res.status(429).json({
      success: false,
      error: 'Free tier limit reached, please wait a minute and try again.',
      retryAfter: Math.max(1, waitSeconds),
      isRateLimit: true
    });
  }

  // Record this request
  userLastRequest.set(clientIp, now);
  globalRequestTimestamps.push(now);

  next();
}

/**
 * Returns current rate limit telemetry for frontend status widgets
 */
function getRateLimitStatus(req) {
  const now = Date.now();
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';
  const lastTime = userLastRequest.get(clientIp) || 0;
  const elapsed = now - lastTime;
  const cooldownRemaining = Math.max(0, Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000));

  // Current global requests in active 60s window
  const activeCount = globalRequestTimestamps.filter(t => now - t < 60000).length;

  return {
    cooldownRemaining,
    requestsInCurrentMinute: activeCount,
    maxRequestsPerMinute: MAX_REQUESTS_PER_MINUTE,
    minIntervalSeconds: MIN_INTERVAL_MS / 1000
  };
}

module.exports = {
  freeTierRateLimiter,
  getRateLimitStatus
};
