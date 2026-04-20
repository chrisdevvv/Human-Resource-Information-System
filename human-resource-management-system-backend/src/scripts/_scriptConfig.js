require("../config/loadEnv");

const normalizeUrl = (value, envLabel) => {
  const normalized = String(value || "")
    .trim()
    .replace(/\/+$/, "");
  if (!normalized) {
    throw new Error(`${envLabel} is required`);
  }
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error(`${envLabel} must be an absolute http(s) URL`);
  }
  return normalized;
};

const requireAnyEnv = (keys) => {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) {
      return value;
    }
  }
  throw new Error(`Missing environment variable: ${keys.join(" or ")}`);
};

const API_BASE_URL = normalizeUrl(
  requireAnyEnv(["API_BASE_URL", "BACKEND_BASE_URL"]),
  "API_BASE_URL",
);

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL
  ? normalizeUrl(process.env.FRONTEND_BASE_URL, "FRONTEND_BASE_URL")
  : "";

const TEST_ADMIN_PASSWORD = requireAnyEnv([
  "TEST_ADMIN_PASSWORD",
  "ADMIN_PASSWORD",
]);

const getFetch = async () =>
  globalThis.fetch || (await import("node-fetch")).default;

const apiUrl = (path) =>
  `${API_BASE_URL}${String(path || "").startsWith("/") ? "" : "/"}${String(path || "")}`;

module.exports = {
  API_BASE_URL,
  FRONTEND_BASE_URL,
  TEST_ADMIN_PASSWORD,
  getFetch,
  apiUrl,
  normalizeUrl,
  requireAnyEnv,
};
