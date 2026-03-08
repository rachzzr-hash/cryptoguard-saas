import { useState } from "react";
import { t, type Lang } from "../i18n";

interface AuthProps {
  lang: Lang;
  mode: "login" | "register";
  onNav: (p: string) => void;
  onSuccess: (user: any, token: string) => void;
}

const GRID_BG = {
  background: "#020617",
  backgroundImage: "linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
} as React.CSSProperties;

const CARD = {
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(6,182,212,0.3)",
  backdropFilter: "blur(10px)",
} as React.CSSProperties;

export default function Auth({ lang, mode, onNav, onSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isLogin && password !== confirmPassword) {
      setError(lang === "fr" ? "Les mots de passe ne correspondent pas" : "Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, lang }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("common.error", lang)); }
      else { localStorage.setItem("cg_token", data.token); onSuccess(data.user, data.token); }
    } catch { setError(t("common.error", lang)); }
    finally { setLoading(false); }
  }

  const inputStyle = {
    background: "rgba(2,6,23,0.8)",
    border: "1px solid rgba(6,182,212,0.25)",
    color: "white",
    outline: "none",
    width: "100%",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={GRID_BG} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => onNav("home")} className="mb-3 block mx-auto transition-all">
            <span style={{ fontSize: "2.5rem", filter: "drop-shadow(0 0 12px #06b6d4)" }}>🛡️</span>
          </button>
          <h1 className="text-3xl font-bold mb-1" style={{
            background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>CryptoGuard</h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#475569" }}>
            {isLogin ? "— System Access —" : "— Create Account —"}
          </p>
        </div>

        <div className="rounded-xl p-8" style={CARD}>
          {!isLogin && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 mb-6 text-xs font-semibold uppercase tracking-wider" style={{
              background: "rgba(6,182,212,0.08)",
              border: "1px solid rgba(6,182,212,0.2)",
              color: "#22d3ee",
            }}>
              🎁 {t("auth.trial", lang)}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: "#06b6d4" }}>{t("auth.email", lang)}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="operator@cryptoguard.io" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#06b6d4")}
                onBlur={e => (e.target.style.borderColor = "rgba(6,182,212,0.25)")} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: "#06b6d4" }}>{t("auth.password", lang)}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#06b6d4")}
                onBlur={e => (e.target.style.borderColor = "rgba(6,182,212,0.25)")} />
            </div>
            {!isLogin && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: "#06b6d4" }}>{t("auth.confirm_password", lang)}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#06b6d4")}
                  onBlur={e => (e.target.style.borderColor = "rgba(6,182,212,0.25)")} />
              </div>
            )}

            {error && (
              <div className="rounded-lg px-4 py-2.5 text-xs font-semibold" style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
              }}>⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 text-white font-bold rounded-lg text-sm uppercase tracking-widest transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
                boxShadow: loading ? "none" : "0 0 20px rgba(6,182,212,0.4)",
              }}>
              {loading ? "[ PROCESSING... ]" : isLogin ? "[ ACCESS SYSTEM ]" : "[ CREATE ACCOUNT ]"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs" style={{ color: "#334155" }}>
            {t(isLogin ? "auth.no_account" : "auth.has_account", lang)}{" "}
            <button onClick={() => onNav(isLogin ? "register" : "login")}
              className="font-semibold transition-colors"
              style={{ color: "#22d3ee" }}>
              {t(isLogin ? "nav.register" : "nav.login", lang)}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#1e293b" }}>CryptoGuard v2.0 | Real-time Protection</p>
      </div>
    </div>
  );
  }
