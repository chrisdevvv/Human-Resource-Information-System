require("./loadEnv");
const mysql = require("mysql2");

const dbName = process.env.DB_NAME;

if (!process.env.DB_NAME) {
  console.warn("[DB] DB_NAME is not set. Falling back to 'esrdatabase'.");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
