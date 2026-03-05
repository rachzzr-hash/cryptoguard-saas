import { Router, Response } from "express";
import { authMiddleware, planRequired, AuthRequest } from "./auth.js";
import { getPool } from "./db.js";

const router = Router();

// ---- STATS (tous les plans) ----
router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [safeRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='SAFE'") as any[];
    const safe = (safeRows as any[])[0];
    const [riskyRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='RISKY'") as any[];
    const risky = (riskyRows as any[])[0];
    const [totalRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens") as any[];
    const total = (totalRows as any[])[0];
    const [walletsRows] = await db.query("SELECT COUNT(*) as count FROM bundle_wallets") as any[];
    const wallets = (walletsRows as any[])[0];
    const [lastRows] = await db.query("SELECT scanned_at FROM scanned_tokens ORDER BY scanned_at DESC LIMIT 1") as any[];
    const lastToken = (lastRows as any[])[0];
    res.json({
      safeTokens: safe?.count || 0,
      riskyTokens: risky?.count || 0,
      totalScanned: total?.count || 0,
      totalWallets: wallets?.count || 0,
      lastScan: lastToken?.scanned_at || null,
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
      `SELECT token_address, token_name, token_score, liquidity, top_holder_pct, scanned_at FROM scanned_tokens WHERE status='SAFE' ORDER BY scanned_at DESC LIMIT ${limit}`
    ) as any[];
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
    ) as any[];
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
    ) as any[];
    // Flouter les adresses pour les utilisateurs free
    const masked = (rows as any[]).map((t, i) => ({
      ...t,
      token_address:
        i < 2 ? t.token_address : t.token_address.slice(0, 4) + "****" + t.token_address.slice(-4),
    }));
    res.json(masked);
  } catch {
    res.status(500).json({ error: "Erreur DB" });
  }
});

export default router;
