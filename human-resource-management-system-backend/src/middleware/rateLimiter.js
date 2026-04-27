const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;

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
  keyGenerator: (req) => {
    const email = req.body?.email;
    if (email && typeof email === "string") {
      return email.trim().toLowerCase();
    }
    return ipKeyGenerator(req.ip);
  },
  message: {
    success: false,
    message:
      "You have reached the maximum number of password reset emails. Please try again after 3 hours.",
  },
});

const cooldownStore = new Map();

const passwordResetCooldown = (req, res, next) => {
  const email = req.body?.email;
  const key =
    email && typeof email === "string"
      ? email.trim().toLowerCase()
      : ipKeyGenerator(req.ip);
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
    for (const [k, v] of cooldownStore.entries()) {
      if (v < cutoff) {
        cooldownStore.delete(k);
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
