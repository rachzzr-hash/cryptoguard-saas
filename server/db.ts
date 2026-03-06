import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = mysql.createPool(process.env.DATABASE_URL + "?waitForConnections=true&connectionLimit=10&queueLimit=0");
    } else {
      pool = mysql.createPool({
        host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
        user: process.env.MYSQLUSER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || "cryptoguard",
        port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
      });
    }
  }
  return pool;
}

export async function initDB(): Promise<void> {
  const db = getPool();

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    plan ENUM('free','pro','business') DEFAULT 'free',
    role VARCHAR(50) DEFAULT 'user',
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  const migrations = [
    "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN plan ENUM('free','pro','business') DEFAULT 'free'",
    "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'",
    "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive'",
    "ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255)",
  ];

  for (const sql of migrations) {
    try { await db.query(sql); } catch { /* column already exists */ }
  }

  await db.query(`CREATE TABLE IF NOT EXISTS scanned_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_address VARCHAR(255) NOT NULL,
    token_name VARCHAR(255),
    token_symbol VARCHAR(50),
    safety_score INT DEFAULT 0,
    market_cap DECIMAL(20,2),
    volume_24h DECIMAL(20,2),
    source VARCHAR(50) DEFAULT 'pump.fun',
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS bundle_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL,
    token_address VARCHAR(255),
    is_bundle BOOLEAN DEFAULT FALSE,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS crypto_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL,
    amount DECIMAL(20,8),
    currency VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  console.log("Database initialized successfully");
}
