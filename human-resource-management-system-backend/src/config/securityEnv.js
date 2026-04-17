const getRequiredEnv = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
};

const JWT_SECRET = getRequiredEnv("JWT_SECRET");

module.exports = {
  JWT_SECRET,
};
