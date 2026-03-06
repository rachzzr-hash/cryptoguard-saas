import { t, type Lang } from "../i18n";

interface LandingProps {
  lang: Lang;
  onNav: (p: string) => void;
  stats?: { totalScanned: number; safeTokens: number; totalWallets: number };
}

export default function Landing({ lang, onNav, stats }: LandingProps) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f4f4f8 0%, #ede9f6 100%)" }} dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-1.5 text-violet-700 text-sm mb-8 shadow-sm">
          <span>⚡</span>
          <span>{t("landing.badge", lang)}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ color: "#1a1a2e" }}>
          {t("landing.title", lang)}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("landing.subtitle", lang)}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => onNav("register")}
            className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-semibold rounded-2xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            {t("landing.cta", lang)}
          </button>
          <button onClick={() => onNav("pricing")}
            className="px-8 py-3.5 bg-white/80 backdrop-blur border border-violet-200 hover:border-violet-400 text-violet-700 font-semibold rounded-2xl text-base transition-all hover:bg-white shadow-sm">
            {t("landing.cta2", lang)}
          </button>
        </div>

        {/* Floating pill badges */}
        <div className="flex flex-wrap gap-2 justify-center mt-8">
          {["🚀 Pump.fun", "⚡ Axiom", "📊 DexScreener", "🛡️ RugCheck", "🔴 Helius RPC"].map(badge => (
            <span key={badge} className="bg-white/70 backdrop-blur border border-violet-100 text-gray-600 text-xs px-3 py-1.5 rounded-full shadow-sm font-medium">
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* LIVE STATS */}
      {stats && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("landing.stats.tokens", lang), value: (stats.totalScanned ?? 0).toLocaleString(), icon: "📊", grad: "from-violet-500 to-purple-600" },
              { label: t("landing.stats.safe", lang), value: (stats.safeTokens ?? 0).toLocaleString(), icon: "✅", grad: "from-emerald-500 to-teal-600" },
              { label: t("landing.stats.wallets", lang), value: (stats.totalWallets ?? 0).toLocaleString(), icon: "🚫", grad: "from-orange-500 to-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white/80 backdrop-blur-xl border border-violet-100 rounded-2xl overflow-hidden shadow-sm">
                <div className={`bg-gradient-to-br ${s.grad} p-4`}>
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <div className="text-white text-2xl font-bold">{s.value}</div>
                </div>
                <div className="px-4 py-2.5">
                  <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-8">
          {lang === "fr" ? "Pourquoi choisir CryptoGuard ?" : lang === "en" ? "Why choose CryptoGuard?" : "¿Por qué elegir CryptoGuard?"}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: t("landing.feat1.title", lang), desc: t("landing.feat1.desc", lang), grad: "from-violet-500 to-purple-600" },
            { icon: "🎯", title: t("landing.feat2.title", lang), desc: t("landing.feat2.desc", lang), grad: "from-red-500 to-rose-600" },
            { icon: "⚡", title: t("landing.feat3.title", lang), desc: t("landing.feat3.desc", lang), grad: "from-emerald-500 to-teal-600" },
          ].map((f) => (
            <div key={f.title} className="bg-white/80 backdrop-blur-xl border border-violet-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`w-12 h-12 bg-gradient-to-br ${f.grad} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-md`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-10">
          {lang === "fr" ? "Comment ça marche ?" : lang === "en" ? "How it works?" : lang === "es" ? "¿Cómo funciona?" : lang === "ar" ? "كيف يعمل؟" : "Como funciona?"}
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", icon: "📡", text: lang === "fr" ? "Pump.fun, Axiom & DexScreener scannent les nouveaux tokens" : "Pump.fun, Axiom & DexScreener scan new tokens" },
            { step: "02", icon: "🔬", text: lang === "fr" ? "RugCheck analyse le score de risque" : "RugCheck analyzes risk score" },
            { step: "03", icon: "✅", text: lang === "fr" ? "Les tokens SAFE sont filtrés et enregistrés" : "SAFE tokens are filtered and saved" },
            { step: "04", icon: "🚀", text: lang === "fr" ? "Vous recevez les alertes dans votre dashboard" : "You receive alerts in your dashboard" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center bg-white/60 backdrop-blur border border-violet-100 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mb-3 shadow-md">
                {s.step}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-sm text-gray-500 text-center leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 rounded-3xl"></div>
          <div className="relative">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="text-2xl font-bold text-white mb-3">{t("landing.cta", lang)}</h2>
            <p className="text-violet-200 text-sm mb-6">{t("auth.trial", lang)}</p>
            <button onClick={() => onNav("register")}
              className="px-8 py-3 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-all shadow-lg hover:-translate-y-0.5">
              {t("landing.cta", lang)} →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-violet-100 py-8 text-center text-gray-400 text-sm">
        <p>© 2025 CryptoGuard · Solana Scanner ·{" "}
          <button onClick={() => onNav("pricing")} className="hover:text-violet-600 ml-2 transition-colors">{t("nav.pricing", lang)}</button>
        </p>
      </footer>
    </div>
  );
}
