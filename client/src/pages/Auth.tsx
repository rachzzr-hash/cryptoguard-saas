import { useState } from "react";
import { t, type Lang } from "../i18n";

interface AuthProps {
  lang: Lang;
  mode: "login" | "register";
  onNav: (p: string) => void;
  onSuccess: (user: any, token: string) => void;
}

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
      if (!res.ok) {
        setError(data.error || t("common.error", lang));
      } else {
        localStorage.setItem("cg_token", data.token);
        onSuccess(data.user, data.token);
      }
    } catch {
      setError(t("common.error", lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#050510" }}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Glow orb */}
      <div style={{
        position: "fixed", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "500px", height: "300px",
        background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.04) 50%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => onNav("home")} className="text-3xl mb-2 block mx-auto">🛡️</button>
          <h1 className="text-xl font-bold text-white">CryptoGuard</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>{t(isLogin ? "auth.login" : "auth.register", lang)}</p>
        </div>

        <div className="rounded-2xl p-8" style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 40px rgba(124,58,237,0.08)",
        }}>
          {!isLogin && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-6 text-sm" style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#a78bfa",
            }}>
              <span>🎁</span>
              <span>{t("auth.trial", lang)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: "#94a3b8" }}>{t("auth.email", lang)}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: "#94a3b8" }}>{t("auth.password", lang)}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            {!isLogin && (
              <div>
                <label className="text-sm mb-1.5 block" style={{ color: "#94a3b8" }}>{t("auth.confirm_password", lang)}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm" style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl text-sm transition-all duration-200 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
                boxShadow: loading ? "none" : "0 0 24px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? t("common.loading", lang) : t(isLogin ? "auth.login.cta" : "auth.register.cta", lang)}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: "#64748b" }}>
            {t(isLogin ? "auth.no_account" : "auth.has_account", lang)}{" "}
            <button
              onClick={() => onNav(isLogin ? "register" : "login")}
              className="hover:underline"
              style={{ color: "#a78bfa" }}
            >
              {t(isLogin ? "nav.register" : "nav.login", lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
                  }
