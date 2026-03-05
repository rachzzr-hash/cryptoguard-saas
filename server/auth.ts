import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "./db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "cryptoguard2026";

export interface AuthRequest extends Request {
  user?: { userId: number; email: string; plan: string };
}

// ---- MIDDLEWARE ----
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

export function planRequired(plans: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié" });
    if (!plans.includes(req.user.plan)) {
      return res.status(403).json({ error: "Plan insuffisant", required: plans });
    }
    next();
  };
}

// ---- REGISTER ----
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, lang = "fr" } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Mot de passe trop court (min 8 caractères)" });
  }
  try {
    const db = getPool();
    const [existing] = await db.query("SELECT id FROM cg_users WHERE email=?", [email]);
    if ((existing as any[]).length > 0) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      "INSERT INTO cg_users (email, password_hash, lang) VALUES (?, ?, ?)",
      [email, hash, lang]
    );
    const userId = (result as any).insertId;
    const token = jwt.sign({ userId, email, plan: "free" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: userId, email, plan: "free", lang } });
  } catch (e: any) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---- LOGIN ----
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM cg_users WHERE email=?", [email]);
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: "Identifiants invalides" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Identifiants invalides" });
    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        lang: user.lang,
        subscription_status: user.subscription_status,
      },
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---- ME ----
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      "SELECT id, email, plan, lang, subscription_status, trial_ends_at, created_at FROM cg_users WHERE id=?",
      [req.user!.userId]
    );
    const user = (rows as any[])[0];
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---- CHANGE LANGUAGE ----
router.put("/lang", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { lang } = req.body;
  const allowed = ["fr", "en", "es", "de", "pt", "ar"];
  if (!allowed.includes(lang)) return res.status(400).json({ error: "Langue non supportée" });
  await getPool().query("UPDATE cg_users SET lang=? WHERE id=?", [lang, req.user!.userId]);
  res.json({ success: true, lang });
});

export default router;
