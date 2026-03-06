import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "./db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "cryptoguard_secret_2024";

export interface AuthRequest extends Request {
  user?: { id: number; email: string; plan: string; role: string };
}

// ---- MIDDLEWARE AUTH ----
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ---- MIDDLEWARE PLAN ----
export function planRequired(minPlan: string) {
  const order = ["free", "pro", "business", "admin"];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "admin") return next();
    const userLevel = order.indexOf(req.user?.plan || "free");
    const required = order.indexOf(minPlan);
    if (userLevel < required) return res.status(403).json({ error: "Plan insuffisant" });
    next();
  };
}

// ---- REGISTER ----
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });
    if (password.length < 6) return res.status(400).json({ error: "Mot de passe trop court (6 min)" });
    const db = getPool();
    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]) as any[];
    if ((existing as any[]).length > 0) return res.status(409).json({ error: "Email deja utilise" });

    const hash = await bcrypt.hash(password, 12);
    const [allUsers] = await db.query("SELECT COUNT(*) as count FROM users") as any[];
    const isFirst = (allUsers as any[])[0]?.count === 0;
    const role = isFirst ? "admin" : "user";
    const plan = isFirst ? "business" : "free";

    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, plan, role) VALUES (?, ?, ?, ?)",
      [email, hash, plan, role]
    ) as any[];

    const token = jwt.sign(
      { id: (result as any).insertId, email, plan, role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, plan, role, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---- LOGIN ----
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]) as any[];
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan, role: user.role || "user" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, plan: user.plan, role: user.role || "user", email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---- ME ----
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT id, email, plan, role, created_at FROM users WHERE id=?", [req.user?.id]) as any[];
    const user = (rows as any[])[0];
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
