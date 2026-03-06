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
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #f4f4f8 0%, #ede9f6 100%)" }}
      dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => onNav("home")}
            className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            🛡️
          </button>
          <h1 className="text-2xl font-bold text-gray-800">CryptoGuard</h1>
          <p className="text-gray-500 text-sm mt-1">{t(isLogin ? "auth.login" : "auth.register", lang)}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-violet-100 rounded-3xl p-8 shadow-xl">
          {!isLogin && (
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-6 text-sm text-violet-700">
              <span>🎁</span>
              <span>{t("auth.trial", lang)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1.5 block">{t("auth.email", lang)}</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full bg-gray-50 border border-violet-200 focus:border-violet-500 focus:bg-white rounded-xl px-4 py-3 text-gray-800 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1.5 block">{t("auth.password", lang)}</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8} placeholder="••••••••"
                className="w-full bg-gray-50 border border-violet-200 focus:border-violet-500 focus:bg-white rounded-xl px-4 py-3 text-gray-800 text-sm outline-none transition-all"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">{t("auth.confirm_password", lang)}</label>
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full bg-gray-50 border border-violet-200 focus:border-violet-500 focus:bg-white rounded-xl px-4 py-3 text-gray-800 text-sm outline-none transition-all"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                  {t("common.loading", lang)}
                </span>
              ) : t(isLogin ? "auth.login.cta" : "auth.register.cta", lang)}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t(isLogin ? "auth.no_account" : "auth.has_account", lang)}{" "}
            <button onClick={() => onNav(isLogin ? "register" : "login")}
              className="text-violet-600 hover:text-violet-800 font-semibold transition-colors">
              {t(isLogin ? "nav.register" : "nav.login", lang)}
            </button>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-4">
          <button onClick={() => onNav("home")} className="text-gray-400 hover:text-violet-600 text-sm transition-colors">
            ← {lang === "fr" ? "Retour à l'accueil" : lang === "en" ? "Back to home" : "Volver al inicio"}
          </button>
        </div>
      </div>
    </div>
  );
}
