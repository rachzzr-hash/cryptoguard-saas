import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { authMiddleware, AuthRequest } from "./auth.js";
import { getPool } from "./db.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

// Plans disponibles
export const PLANS = {
  free: { name: "Free", price: 0, priceId: null },
  pro: { name: "Pro", price: 29, priceId: process.env.STRIPE_PRICE_PRO },
  business: { name: "Business", price: 79, priceId: process.env.STRIPE_PRICE_BUSINESS },
};

// ---- CREER SESSION CHECKOUT ----
router.post("/checkout", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { plan } = req.body;
  if (!["pro", "business"].includes(plan)) {
    return res.status(400).json({ error: "Plan invalide" });
  }
  const priceId = PLANS[plan as keyof typeof PLANS].priceId;
  if (!priceId) {
    return res.status(500).json({ error: "ID de prix Stripe non configure" });
  }
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM users WHERE id=?", [req.user!.id]) as any[];
    const user = (rows as any[])[0];
    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: req.user!.email });
      customerId = customer.id;
      await db.query("UPDATE users SET stripe_customer_id=? WHERE id=?", [customerId, req.user!.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card", "paypal"] as any,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.APP_URL || "http://localhost:5173"}/dashboard?success=1`,
      cancel_url: `${process.env.APP_URL || "http://localhost:5173"}/pricing?cancelled=1`,
      subscription_data: { trial_period_days: 7 },
    metadata: { userId: String(req.user!.id), plan },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- PORTAIL CLIENT (gerer abonnement) ----
router.post("/portal", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT stripe_customer_id FROM users WHERE id=?", [req.user!.id]) as any[];
    const user = (rows as any[])[0];
    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: "Pas d'abonnement actif" });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.APP_URL || "http://localhost:5173"}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- WEBHOOK STRIPE ----
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const db = getPool();
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, plan } = session.metadata || {};
      if (userId && plan) {
        await db.query(
          "UPDATE users SET plan=?, subscription_status='active', stripe_subscription_id=? WHERE id=?",
          [plan, session.subscription, parseInt(userId)]
        );
        console.log(`[Stripe] Abonnement ${plan} active pour user ${userId}`);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.query(
        "UPDATE users SET plan='free', subscription_status='inactive' WHERE stripe_subscription_id=?",
        [sub.id]
      );
      console.log(`[Stripe] Abonnement annule: ${sub.id}`);
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      await db.query(
        "UPDATE users SET subscription_status='inactive' WHERE stripe_customer_id=?",
        [(inv as any).customer]
      );
      break;
    }
  }

  res.json({ received: true });
});

export default router;
