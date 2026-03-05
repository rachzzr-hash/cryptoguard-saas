import mysql from "mysql2/promise";
import "dotenv/config";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export async function initDB(): Promise<void> {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS cg_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(200) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      plan ENUM('free','pro','business') DEFAULT 'free',
      stripe_customer_id VARCHAR(100),
      stripe_subscription_id VARCHAR(100),
      subscription_status ENUM('active','inactive','trial') DEFAULT 'trial',
      trial_ends_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
      lang VARCHAR(10) DEFAULT 'fr',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS scanned_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token_address VARCHAR(100) UNIQUE NOT NULL,
      token_name VARCHAR(200),
      token_score INT DEFAULT 0,
      liquidity FLOAT DEFAULT 0,
      top_holder_pct FLOAT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'SAFE',
      webhook_sent TINYINT DEFAULT 0,
      scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bundle_wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wallet_address VARCHAR(100) UNIQUE NOT NULL,
      win_rate FLOAT DEFAULT 0,
      total_transactions INT DEFAULT 0,
      webhook_sent TINYINT DEFAULT 0,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("[DB] ✅ Tables prêtes");
}
