require("./loadEnv");
const mysql = require("mysql2");

const dbName2 = process.env.DB_NAME;

if (!process.env.DB_NAME2) {
  console.warn("[DB] DB_NAME2 is not set. Falling back to 'deped_csjdm_db'.");
}

const dbCsjdm = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName2,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = dbCsjdm;
