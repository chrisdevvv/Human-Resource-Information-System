const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const getEmailOrIpKey = (req) => {
  const email = req.body?.email;

  if (email && typeof email === "string") {
    return email.trim().toLowerCase();
  }

  return ipKeyGenerator(req);
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

const passwordResetResendLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getEmailOrIpKey,
  message: {
    success: false,
    message:
      "You have reached the maximum number of password reset emails. Please try again after 3 hours.",
  },
});

const cooldownStore = new Map();

const passwordResetCooldown = (req, res, next) => {
  const key = getEmailOrIpKey(req);
  const now = Date.now();
  const lastAttempt = cooldownStore.get(key);

  if (lastAttempt) {
    const elapsed = now - lastAttempt;
    const cooldownMs = 90 * 1000;

    if (elapsed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before resending another password reset email.`,
      });
    }
  }

  cooldownStore.set(key, now);

  if (cooldownStore.size > 10000) {
    const cutoff = now - 3 * 60 * 60 * 1000;

    for (const [storedKey, timestamp] of cooldownStore.entries()) {
      if (timestamp < cutoff) {
        cooldownStore.delete(storedKey);
      }
    }
  }

  next();
};

module.exports = {
  globalLimiter,
  authLimiter,
  passwordResetResendLimiter,
  passwordResetCooldown,
};