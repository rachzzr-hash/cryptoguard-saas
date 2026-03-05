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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => onNav("home")} className="text-3xl mb-2 block mx-auto">🛡️</button>
          <h1 className="text-xl font-bold text-white">CryptoGuard</h1>
          <p className="text-gray-500 text-sm mt-1">{t(isLogin ? "auth.login" : "auth.register", lang)}</p>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8">
          {!isLogin && (
            <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-500/20 rounded-lg px-4 py-2.5 mb-6 text-sm text-blue-300">
              <span>🎁</span>
              <span>{t("auth.trial", lang)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">{t("auth.email", lang)}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#0f1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">{t("auth.password", lang)}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full bg-[#0f1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">{t("auth.confirm_password", lang)}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {loading ? t("common.loading", lang) : t(isLogin ? "auth.login.cta" : "auth.register.cta", lang)}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            {t(isLogin ? "auth.no_account" : "auth.has_account", lang)}{" "}
            <button
              onClick={() => onNav(isLogin ? "register" : "login")}
              className="text-blue-400 hover:text-blue-300"
            >
              {t(isLogin ? "nav.register" : "nav.login", lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
