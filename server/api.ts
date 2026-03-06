import { Router, Response } from "express";
import { authMiddleware, planRequired, AuthRequest } from "./auth.js";
import { getPool } from "./db.js";

const router = Router();

router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [safeRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='SAFE'") as any[];
    const [totalRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens") as any[];
    const [walletRows] = await db.query("SELECT COUNT(*) as count FROM bundle_wallets") as any[];
    res.json({ totalScanned: (totalRows as any[])[0]?.count || 0, safeTokens: (safeRows as any[])[0]?.count || 0, totalWallets: (walletRows as any[])[0]?.count || 0 });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/tokens", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const plan = req.user?.plan || "free";
    const source = req.query.source as string || "";
    const limit = plan === "free" ? 5 : 1000;
    let query = "SELECT * FROM scanned_tokens WHERE status='SAFE'";
    const params: any[] = [];
    if (source) { query += " AND source=?"; params.push(source); }
    query += " ORDER BY scanned_at DESC LIMIT ?";
    params.push(limit);
    const [rows] = await db.query(query, params) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/tokens/source/:source", authMiddleware, planRequired("pro"), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM scanned_tokens WHERE source=? ORDER BY scanned_at DESC LIMIT 100", [req.params.source]) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/tokens/performing", authMiddleware, planRequired("pro"), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM scanned_tokens WHERE source='performing' OR source='pumpfun_trending' ORDER BY scanned_at DESC LIMIT 50") as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/wallets", authMiddleware, planRequired("pro"), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM bundle_wallets ORDER BY detected_at DESC LIMIT 100") as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/safe-tokens", authMiddleware, planRequired("pro"), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM scanned_tokens WHERE status='SAFE' ORDER BY scanned_at DESC LIMIT 500") as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/preview-tokens", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM scanned_tokens WHERE status='SAFE' ORDER BY scanned_at DESC LIMIT 5") as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/rug-wallets", authMiddleware, planRequired("business"), async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM bundle_wallets ORDER BY detected_at DESC LIMIT 200") as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/dashboard/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [totalRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens") as any[];
    const [safeRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='SAFE'") as any[];
    const [riskyRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='RISKY'") as any[];
    const [walletRows] = await db.query("SELECT COUNT(*) as count FROM bundle_wallets") as any[];
    res.json({
      totalScanned: (totalRows as any[])[0]?.count || 0,
      safeTokens: (safeRows as any[])[0]?.count || 0,
      riskyTokens: (riskyRows as any[])[0]?.count || 0,
      totalWallets: (walletRows as any[])[0]?.count || 0,
    });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

function adminOnly(req: AuthRequest, res: Response, next: any) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

router.get("/admin/tokens", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const page = parseInt(req.query.page as string) || 1;
    const limit = 100;
    const offset = (page - 1) * limit;
    const status = req.query.status as string || "";
    const source = req.query.source as string || "";
    let query = "SELECT * FROM scanned_tokens";
    const params: any[] = [];
    const where: string[] = [];
    if (status) { where.push("status=?"); params.push(status); }
    if (source) { where.push("source=?"); params.push(source); }
    if (where.length) query += " WHERE " + where.join(" AND ");
    query += " ORDER BY scanned_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const [rows] = await db.query(query, params) as any[];
    const [countRows] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens") as any[];
    res.json({ tokens: rows, total: (countRows as any[])[0]?.count || 0 });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/admin/users", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT id, email, plan, role, created_at FROM users ORDER BY created_at DESC") as any[];
    res.json({ users: rows });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.patch("/admin/users/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const { plan, role } = req.body;
    if (plan) await db.query("UPDATE users SET plan=? WHERE id=?", [plan, req.params.id]);
    if (role) await db.query("UPDATE users SET role=? WHERE id=?", [role, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.delete("/admin/tokens/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM scanned_tokens WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.get("/admin/stats", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [users] = await db.query("SELECT COUNT(*) as count FROM users") as any[];
    const [tokens] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens") as any[];
    const [safe] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='SAFE'") as any[];
    const [risky] = await db.query("SELECT COUNT(*) as count FROM scanned_tokens WHERE status='RISKY'") as any[];
    const [wallets] = await db.query("SELECT COUNT(*) as count FROM bundle_wallets") as any[];
    const [bySourceRows] = await db.query("SELECT source, COUNT(*) as count FROM scanned_tokens GROUP BY source") as any[];
    const bySource: Record<string, number> = {};
    for (const row of (bySourceRows as any[])) {
      bySource[row.source || "unknown"] = row.count;
    }
    res.json({
      totalUsers: (users as any[])[0]?.count || 0,
      totalTokens: (tokens as any[])[0]?.count || 0,
      safeTokens: (safe as any[])[0]?.count || 0,
      riskyTokens: (risky as any[])[0]?.count || 0,
      totalWallets: (wallets as any[])[0]?.count || 0,
      bySource,
    });
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

router.post("/admin/scan", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { runScanner } = await import("./scanner.js");
    runScanner().catch(console.error);
    res.json({ message: "Scan lance en arriere-plan" });
  } catch (err) { res.status(500).json({ error: "Erreur scan" }); }
});

export default router;
