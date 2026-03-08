import { t, type Lang } from "../i18n";

interface LandingProps {
  lang: Lang;
  onNav: (p: string) => void;
  stats?: { totalScanned: number; safeTokens: number; totalWallets: number };
}

const GRID_BG = {
  background: "#020617",
  backgroundImage: "linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
} as React.CSSProperties;

const CARD = {
  background: "rgba(15,23,42,0.85)",
  border: "1px solid rgba(6,182,212,0.25)",
  backdropFilter: "blur(10px)",
} as React.CSSProperties;

const BTN_CYAN = {
  background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
  boxShadow: "0 0 24px rgba(6,182,212,0.45)",
} as React.CSSProperties;

export default function Landing({ lang, onNav, stats }: LandingProps) {
  return (
    <div className="min-h-screen" style={GRID_BG} dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span style={{ fontSize: "2.8rem", filter: "drop-shadow(0 0 14px #06b6d4)" }}>🛡️</span>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight" style={{
            background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            CryptoGuard
          </h1>
        </div>
        <p className="text-base md:text-lg mb-5 max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
          {t("landing.subtitle", lang)}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8" style={{
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.3)",
        }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#34d399" }}>System Online</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onNav("register")}
            className="px-8 py-3.5 text-white font-bold rounded-lg text-sm uppercase tracking-widest transition-all duration-200"
            style={BTN_CYAN}
          >
            {t("landing.cta", lang)}
          </button>
          <button
            onClick={() => onNav("pricing")}
            className="px-8 py-3.5 font-semibold rounded-lg text-sm uppercase tracking-widest transition-all duration-200"
            style={{ ...CARD, color: "#22d3ee" }}
          >
            {t("landing.cta2", lang)}
          </button>
        </div>
      </section>

      {/* LIVE STATS */}
      {stats && (
        <section className="max-w-5xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("landing.stats.tokens", lang), value: stats.totalScanned.toLocaleString(), icon: "📊", color: "#22d3ee" },
              { label: t("landing.stats.safe", lang), value: stats.safeTokens.toLocaleString(), icon: "🛡️", color: "#34d399" },
              { label: t("landing.stats.wallets", lang), value: stats.totalWallets.toLocaleString(), icon: "⚠️", color: "#f87171" },
              { label: "Scan Rate", value: "15 min", icon: "⚡", color: "#fbbf24" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4" style={CARD}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>{s.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-2xl font-bold text-white">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-center mb-8" style={{ color: "#06b6d4" }}>
          ── Core Features ──
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "🔍", title: t("landing.feat1.title", lang), desc: t("landing.feat1.desc", lang), accentColor: "#22d3ee", borderColor: "rgba(6,182,212,0.3)" },
            { icon: "🎯", title: t("landing.feat2.title", lang), desc: t("landing.feat2.desc", lang), accentColor: "#f87171", borderColor: "rgba(239,68,68,0.3)" },
            { icon: "⚡", title: t("landing.feat3.title", lang), desc: t("landing.feat3.desc", lang), accentColor: "#34d399", borderColor: "rgba(16,185,129,0.3)" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-6" style={{ ...CARD, border: `1px solid ${f.borderColor}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: f.accentColor }}>● System Module</p>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto px-4 pb-14 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: "#06b6d4" }}>
          ── Protocol Sequence ──
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "01", icon: "📡", text: lang === "fr" ? "DexScreener scanne les nouveaux tokens Solana" : "DexScreener scans new Solana tokens" },
            { step: "02", icon: "🔬", text: lang === "fr" ? "RugCheck analyse le score de risque" : "RugCheck analyzes the risk score" },
            { step: "03", icon: "✅", text: lang === "fr" ? "Les tokens SAFE sont filtrés" : "SAFE tokens are filtered and saved" },
            { step: "04", icon: "🚀", text: lang === "fr" ? "Alertes dans votre dashboard" : "Alerts in your dashboard" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center rounded-xl p-5" style={CARD}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono mb-3" style={{
                background: "rgba(6,182,212,0.12)",
                border: "1px solid #06b6d4",
                color: "#22d3ee",
              }}>
                {s.step}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="max-w-2xl mx-auto px-4 pb-16 text-center">
        <div className="rounded-xl p-10" style={CARD}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06b6d4" }}>── Access System ──</p>
          <h2 className="text-2xl font-bold text-white mb-3">{t("landing.cta", lang)}</h2>
feat: cyberpunk redesign - Landing.tsx cyan grid terminal style          <button
            onClick={() => onNav("register")}
            className="px-8 py-3 text-white font-bold rounded-lg text-sm uppercase tracking-widest transition-all duration-200"
            style={BTN_CYAN}
          >
            {t("landing.cta", lang)}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs" style={{ borderTop: "1px solid rgba(6,182,212,0.15)", color: "#334155" }}>
        <p>CryptoGuard v2.0 | Real-time Protection ·
          <button onClick={() => onNav("pricing")} className="ml-2 transition-colors" style={{ color: "#475569" }}>{t("nav.pricing", lang)}</button>
        </p>
      </footer>
    </div>
  );
      }
