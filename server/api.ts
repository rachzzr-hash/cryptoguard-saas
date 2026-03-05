import { Router, Response } from "express";
import { authMiddleware, planRequired, AuthRequest } from "./auth.js";
import { getPool } from "./db.js";

const router = Router();

// ---- STATS (tous les plans) ----
router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [[safe]] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='SAFE'");
    const [[risky]] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='RISKY'");
    const [[total]] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens");
    const [[wallets]] = await db.query("SELECT COUNT(*) as count FROM bundle_wallets");
    const [[lastToken]] = await db.query("SELECT scanned_at FROM scanned_tokens ORDER BY scanned_at DESC LIMIT 1");

    res.json({
      safeTokens: (safe as any).count || 0,
      riskyTokens: (risky as any).count || 0,
      totalScanned: (total as any).count || 0,
      totalWallets: (wallets as any).count || 0,
      lastScan: (lastToken as any)?.scanned_at || null,
    });
  } catch {
    res.status(500).json({ error: "Erreur DB" });
  }
});

// ---- SAFE TOKENS (plan pro + business) ----
router.get("/safe-tokens", authMiddleware, planRequired(["pro", "business"]), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const limit = req.user?.plan === "business" ? 200 : 50;
    const [rows] = await db.query(
      `SELECT token_address, token_name, token_score, liquidity, top_holder_pct, scanned_at
       FROM scanned_tokens WHERE status='SAFE' ORDER BY scanned_at DESC LIMIT ${limit}`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Erreur DB" });
  }
});

// ---- RUG WALLETS (plan business uniquement) ----
router.get("/rug-wallets", authMiddleware, planRequired(["business"]), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      "SELECT wallet_address, win_rate, total_transactions, detected_at FROM bundle_wallets ORDER BY detected_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Erreur DB" });
  }
});

// ---- PREVIEW TOKENS (plan free — 5 tokens floutés) ----
router.get("/preview-tokens", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      "SELECT token_address, token_name, token_score, liquidity, scanned_at FROM scanned_tokens WHERE status='SAFE' ORDER BY scanned_at DESC LIMIT 5"
    );
    // Flouter les adresses pour les utilisateurs free
    const masked = (rows as any[]).map((t, i) => ({
      ...t,
      token_address: i < 2 ? t.token_address : t.token_address.slice(0, 4) + "****" + t.token_address.slice(-4),
    }));
    res.json(masked);
  } catch {
    res.status(500).json({ error: "Erreur DB" });
  }
});

export default router;
