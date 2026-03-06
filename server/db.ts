import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
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
  return pool;
}

export async function initDB(): Promise<void> {
  const db = getPool();

  // Table users
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      plan ENUM('free','pro','business') DEFAULT 'free',
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ajouter colonne role si elle n'existe pas
  try {
    await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'");
  } catch { /* column already exists */ }

  // Table scanned_tokens
  await db.query(`
    CREATE TABLE IF NOT EXISTS scanned_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token_address VARCHAR(255) UNIQUE NOT NULL,
      token_name VARCHAR(255),
      token_score INT DEFAULT 0,
      liquidity DECIMAL(20,2) DEFAULT 0,
      top_holder_pct DECIMAL(5,2) DEFAULT 0,
      status ENUM('SAFE','RISKY') DEFAULT 'RISKY',
      source VARCHAR(100) DEFAULT 'dexscreener',
      scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ajouter colonne source si elle n'existe pas
  try {
    await db.query("ALTER TABLE scanned_tokens ADD COLUMN source VARCHAR(100) DEFAULT 'dexscreener'");
  } catch { /* column already exists */ }

  // Table bundle_wallets
  await db.query(`
    CREATE TABLE IF NOT EXISTS bundle_wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wallet_address VARCHAR(255) UNIQUE NOT NULL,
      win_rate DECIMAL(5,2) DEFAULT 0,
      total_transactions INT DEFAULT 0,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("[DB] Tables initialisées");
}
