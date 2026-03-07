import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    if (process.env.DATABASE_URL) {h
      pool = mysql.createPool(
        process.env.DATABASE_URL +
          "?waitForConnections=true&connectionLimit=10&queueLimit=0"
      );
    } else {
      pool = mysql.createPool({
        host: process.env.MYSQLHOST || "localhost",
        port: parseInt(process.env.MYSQLPORT || "3306"),
        user: process.env.MYSQLUSER || "root",
        password: process.env.MYSQLPASSWORD || "",
        database: process.env.MYSQL_DATABASE || "cryptoguard",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
  }
  return pool;
}

export async function initDB(): Promise<void> {
  const db = getPool();

  // Users table — CREATE only, never DROP (preserve accounts)
  await db.query(`
    CREATE TABLE IF NOT EXISTS cg_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      plan ENUM('free','pro','business') DEFAULT 'free',
      role VARCHAR(50) DEFAULT 'user',
      stripe_customer_id VARCHAR(255),
      subscription_status VARCHAR(50) DEFAULT 'inactive',
      stripe_subscription_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scanned tokens table
  await db.query(`
    CREATE TABLE IF NOT EXISTS scanned_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token_address VARCHAR(100) UNIQUE NOT NULL,
      token_name VARCHAR(200),
      token_score INT DEFAULT 0,
      liquidity FLOAT DEFAULT 0,
      top_holder_pct FLOAT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'SAFE',
      source VARCHAR(50) DEFAULT 'dexscreener',
      scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bundle wallets table
  await db.query(`
    CREATE TABLE IF NOT EXISTS bundle_wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wallet_address VARCHAR(100) UNIQUE NOT NULL,
      win_rate FLOAT DEFAULT 0,
      total_transactions INT DEFAULT 0,
      avg_entry_mcap FLOAT DEFAULT 0,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crypto payments table
  await db.query(`
    CREATE TABLE IF NOT EXISTS crypto_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      payment_id VARCHAR(255) UNIQUE,
      amount DECIMAL(10,2),
      currency VARCHAR(10),
      status VARCHAR(50) DEFAULT 'pending',
      plan VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database initialized successfully");
}
