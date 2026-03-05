import { Router, Request, Response } from "express";
import { authMiddleware, AuthRequest } from "./auth.js";
import { getPool } from "./db.js";

const router = Router();

const NP_API = "https://api.nowpayments.io/v1";
const NP_KEY = process.env.NOWPAYMENTS_API_KEY || "";

const PLAN_PRICES: Record<string, number> = {
  pro: 29,
  business: 79,
};

router.post("/create", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { plan, currency } = req.body;
  if (!["pro", "business"].includes(plan)) return res.status(400).json({ error: "Plan invalide" });
  if (!NP_KEY) return res.status(500).json({ error: "NOWPayments non configure (NOWPAYMENTS_API_KEY manquant)" });
  const amount = PLAN_PRICES[plan];
  const userId = req.user!.userId;
  const email = req.user!.email;
  try {
    const body = {
      price_amount: amount,
      price_currency: "usd",
      pay_currency: currency || "sol",
      order_id: `cg-${userId}-${plan}-${Date.now()}`,
      order_description: `CryptoGuard ${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${email}`,
      ipn_callback_url: `${process.env.APP_URL || ""}/api/crypto/webhook`,
      success_url: `${process.env.APP_URL || "http://localhost:5173"}/?success=1`,
      cancel_url: `${process.env.APP_URL || "http://localhost:5173"}/pricing?cancelled=1`,
      is_fee_paid_by_user: false,
    };
    const resp = await fetch(`${NP_API}/invoice`, {
      method: "POST",
      headers: { "x-api-key": NP_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: any = await resp.json();
    if (!resp.ok || !data.invoice_url) return res.status(500).json({ error: data.message || "Erreur NOWPayments" });
    const db = getPool();
    await db.query(
      "INSERT INTO cg_crypto_payments (user_id, plan, order_id, currency, amount_usd, status) VALUES (?, ?, ?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE status='pending'",
      [userId, plan, body.order_id, currency || "sol", amount]
    );
    res.json({ invoice_url: data.invoice_url, payment_id: data.id, order_id: body.order_id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const { payment_status, order_id } = req.body;
    if (["finished", "confirmed", "sending"].includes(payment_status)) {
      const db = getPool();
      const [rows] = await db.query("SELECT * FROM cg_crypto_payments WHERE order_id=?", [order_id]);
      const payment = (rows as any[])[0];
      if (payment && payment.status !== "completed") {
        await db.query("UPDATE cg_users SET plan=?, subscription_status='active' WHERE id=?", [payment.plan, payment.user_id]);
        await db.query("UPDATE cg_crypto_payments SET status='completed' WHERE order_id=?", [order_id]);
        console.log(`[NOWPayments] Plan ${payment.plan} active pour user ${payment.user_id}`);
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/currencies", async (_req: Request, res: Response) => {
  res.json({ currencies: ["SOL", "BTC", "ETH", "USDT", "USDC", "BNB", "MATIC"] });
});

export default router;
