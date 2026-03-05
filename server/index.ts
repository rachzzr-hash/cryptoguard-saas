import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { initDB } from "./db.js";
import authRouter from "./auth.js";
import apiRouter from "./api.js";
import stripeRouter from "./stripe.js";
import cryptoRouter from "./nowpayments.js";
import { runScanner, runRuggerDetector } from "./scanner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3001");

app.use(cors({ origin: process.env.APP_URL || "http://localhost:5173", credentials: true }));
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/dashboard", apiRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/crypto", cryptoRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

async function start() {
  try {
    await initDB();
    console.log("[DB] Connecte");
  } catch (err) {
    console.error("[DB] Erreur de connexion:", err);
    process.exit(1);
  }

  console.log("[Scanner] Premier scan au demarrage...");
  runScanner().catch(console.error);
  runRuggerDetector().catch(console.error);

  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Scan automatique");
    await runScanner().catch(console.error);
    await runRuggerDetector().catch(console.error);
  });

  app.listen(PORT, () => {
    console.log(`CryptoGuard API demarre sur http://localhost:${PORT}`);
  });
}

start();
