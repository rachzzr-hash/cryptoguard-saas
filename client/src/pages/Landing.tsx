import { t, type Lang } from "../i18n";

interface LandingProps {
  lang: Lang;
  onNav: (p: string) => void;
  stats?: { totalScanned: number; safeTokens: number; totalWallets: number };
}

export default function Landing({ lang, onNav, stats }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#0f1117]" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-8">
          <span>⚡</span>
          <span>{t("landing.badge", lang)}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          {t("landing.title", lang)}
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("landing.subtitle", lang)}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onNav("register")}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-base transition-colors"
          >
            {t("landing.cta", lang)}
          </button>
          <button
            onClick={() => onNav("pricing")}
            className="px-8 py-3.5 bg-[#161b22] border border-[#30363d] hover:border-gray-500 text-gray-300 font-medium rounded-lg text-base transition-colors"
          >
            {t("landing.cta2", lang)}
          </button>
        </div>
      </section>

      {/* LIVE STATS */}
      {stats && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("landing.stats.tokens", lang), value: stats.totalScanned.toLocaleString(), icon: "📊" },
              { label: t("landing.stats.safe", lang), value: stats.safeTokens.toLocaleString(), icon: "✅" },
              { label: t("landing.stats.wallets", lang), value: stats.totalWallets.toLocaleString(), icon: "🚫" },
            ].map((s) => (
              <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: t("landing.feat1.title", lang), desc: t("landing.feat1.desc", lang), color: "blue" },
            { icon: "🎯", title: t("landing.feat2.title", lang), desc: t("landing.feat2.desc", lang), color: "red" },
            { icon: "⚡", title: t("landing.feat3.title", lang), desc: t("landing.feat3.desc", lang), color: "green" },
          ].map((f) => (
            <div key={f.title} className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-10">
          {lang === "fr" ? "Comment ça marche ?" :
           lang === "en" ? "How it works?" :
           lang === "es" ? "¿Cómo funciona?" :
           lang === "ar" ? "كيف يعمل؟" : "Como funciona?"}
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", icon: "📡", text: lang === "fr" ? "DexScreener scanne les nouveaux tokens Solana" : lang === "en" ? "DexScreener scans new Solana tokens" : "DexScreener escanea nuevos tokens Solana" },
            { step: "02", icon: "🔬", text: lang === "fr" ? "RugCheck analyse le score de risque" : lang === "en" ? "RugCheck analyzes risk score" : "RugCheck analiza la puntuación de riesgo" },
            { step: "03", icon: "✅", text: lang === "fr" ? "Les tokens SAFE sont filtrés et enregistrés" : lang === "en" ? "SAFE tokens are filtered and saved" : "Los tokens SAFE son filtrados y guardados" },
            { step: "04", icon: "🚀", text: lang === "fr" ? "Vous recevez les alertes dans votre dashboard" : lang === "en" ? "You receive alerts in your dashboard" : "Recibes alertas en tu panel" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-bold mb-3">
                {s.step}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-sm text-gray-400 text-center">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">{t("landing.cta", lang)}</h2>
          <p className="text-gray-400 text-sm mb-6">{t("auth.trial", lang)}</p>
          <button
            onClick={() => onNav("register")}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
          >
            {t("landing.cta", lang)}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#30363d] py-8 text-center text-gray-600 text-sm">
        <p>© 2025 CryptoGuard · Solana Scanner ·
          <button onClick={() => onNav("pricing")} className="hover:text-gray-400 ml-2">{t("nav.pricing", lang)}</button>
        </p>
      </footer>
    </div>
  );
}
