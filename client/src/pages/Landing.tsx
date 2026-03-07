import { t, type Lang } from "../i18n";

interface LandingProps {
  lang: Lang;
  onNav: (p: string) => void;
  stats?: { totalScanned: number; safeTokens: number; totalWallets: number };
}

export default function Landing({ lang, onNav, stats }: LandingProps) {
  return (
    <div className="min-h-screen" style={{ background: "#050510" }} dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* HERO */}
      <section className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 text-center overflow-hidden">
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px", height: "500px",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8" style={{
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
          }}>
            <span>⚡</span>
            <span>{t("landing.badge", lang)}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            {t("landing.title", lang)}
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#94a3b8" }}>
            {t("landing.subtitle", lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNav("register")}
              className="px-8 py-3.5 text-white font-semibold rounded-xl text-base transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
                boxShadow: "0 0 28px rgba(124,58,237,0.5)",
              }}
            >
              {t("landing.cta", lang)}
            </button>
            <button
              onClick={() => onNav("pricing")}
              className="px-8 py-3.5 font-medium rounded-xl text-base transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
              }}
            >
              {t("landing.cta2", lang)}
            </button>
          </div>
        </div>
      </section>

      {stats && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("landing.stats.tokens", lang), value: stats.totalScanned.toLocaleString(), icon: "📊" },
              { label: t("landing.stats.safe", lang), value: stats.safeTokens.toLocaleString(), icon: "✅" },
              { label: t("landing.stats.wallets", lang), value: stats.totalWallets.toLocaleString(), icon: "🚫" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5 text-center" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
              }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs mt-1" style={{ color: "#64748b" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: t("landing.feat1.title", lang), desc: t("landing.feat1.desc", lang) },
            { icon: "🎯", title: t("landing.feat2.title", lang), desc: t("landing.feat2.desc", lang) },
            { icon: "⚡", title: t("landing.feat3.title", lang), desc: t("landing.feat3.desc", lang) },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl p-6" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-10">
          {lang === "fr" ? "Comment ça marche ?" : lang === "en" ? "How it works?" : lang === "es" ? "¿Cómo funciona?" : lang === "ar" ? "كيف يعمل؟" : "Como funciona?"}
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", icon: "📡", text: lang === "fr" ? "DexScreener scanne les nouveaux tokens Solana" : "DexScreener scans new Solana tokens" },
            { step: "02", icon: "🔬", text: lang === "fr" ? "RugCheck analyse le score de risque" : "RugCheck analyzes risk score" },
            { step: "03", icon: "✅", text: lang === "fr" ? "Les tokens SAFE sont filtrés et enregistrés" : "SAFE tokens are filtered and saved" },
            { step: "04", icon: "🚀", text: lang === "fr" ? "Vous recevez les alertes dans votre dashboard" : "You receive alerts in your dashboard" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3" style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.4)",
                color: "#a78bfa",
              }}>
                {s.step}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-sm text-center" style={{ color: "#94a3b8" }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="rounded-2xl p-10" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 100%)",
          border: "1px solid rgba(124,58,237,0.25)",
          backdropFilter: "blur(10px)",
        }}>
          <h2 className="text-2xl font-bold text-white mb-3">{t("landing.cta", lang)}</h2>
          <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>{t("auth.trial", lang)}</p>
          <button
            onClick={() => onNav("register")}
            className="px-8 py-3 text-white font-semibold rounded-xl transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
              boxShadow: "0 0 24px rgba(124,58,237,0.5)",
            }}
          >
            {t("landing.cta", lang)}
          </button>
        </div>
      </section>

      <footer className="py-8 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#475569" }}>
        <p>© 2025 CryptoGuard · Solana Scanner ·
          <button onClick={() => onNav("pricing")} className="hover:text-gray-400 ml-2">{t("nav.pricing", lang)}</button>
        </p>
      </footer>
    </div>
  );
                }
