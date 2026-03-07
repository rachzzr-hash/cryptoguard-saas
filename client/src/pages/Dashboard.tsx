import { useState, useEffect, useCallback } from "react";
import { t, type Lang } from "../i18n";

interface DashboardProps {
  lang: Lang;
  user: any;
  token: string;
  onNav: (p: string) => void;
}

function apiFetch(path: string, token: string) {
  return fetch(`/api/dashboard${path}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
}
function fmt(addr: string, n = 6) { if (!addr) return "—"; return addr.slice(0, n) + "..." + addr.slice(-4); }
function fmtLiq(v: number) { if (!v) return "—"; if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M"; if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K"; return "$" + v.toFixed(0); }
function fmtDate(s: string) { if (!s) return "—"; const d = new Date(s); return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }

type SourceTab = "all" | "pumpfun" | "axiom" | "performing";

const glass = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" } as React.CSSProperties;
const glassBright = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" } as React.CSSProperties;

export default function Dashboard({ lang, user, token, onNav }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [mainTab, setMainTab] = useState<"tokens" | "wallets">("tokens");
  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isProOrBusiness = user?.plan === "pro" || user?.plan === "business";
  const isBusiness = user?.plan === "business";
  const isAdmin = user?.role === "admin";

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const statsData = await apiFetch("/stats", token);
      setStats(statsData);
      if (isProOrBusiness || isAdmin) {
        const tokensData = await apiFetch("/safe-tokens", token);
        setTokens(Array.isArray(tokensData) ? tokensData : []);
      } else {
        const preview = await apiFetch("/preview-tokens", token);
        setTokens(Array.isArray(preview) ? preview : []);
      }
      if (isBusiness || isAdmin) {
        const walletsData = await apiFetch("/rug-wallets", token);
        setWallets(Array.isArray(walletsData) ? walletsData : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, isProOrBusiness, isBusiness, isAdmin]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleManageSub() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {}
  }

  const sourceFiltered = tokens.filter(tk => {
    if (sourceTab === "all") return true;
    const src = (tk.source || "dexscreener").toLowerCase();
    if (sourceTab === "pumpfun") return src.includes("pump");
    if (sourceTab === "axiom") return src.includes("axiom");
    if (sourceTab === "performing") return src.includes("performing");
    return true;
  });
  const filteredTokens = sourceFiltered.filter(tk => !search || (tk.token_name || "").toLowerCase().includes(search.toLowerCase()) || (tk.token_address || "").toLowerCase().includes(search.toLowerCase()));
  const filteredWallets = wallets.filter(w => !search || (w.wallet_address || "").toLowerCase().includes(search.toLowerCase()));

  const sourceTabs: { id: SourceTab; label: string; icon: string }[] = [
    { id: "all", label: "All Sources", icon: "🔍" },
    { id: "pumpfun", label: "Pump.fun", icon: "🚀" },
    { id: "axiom", label: "Axiom", icon: "⚡" },
    { id: "performing", label: "Performing", icon: "📈" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="rounded-2xl p-8 flex flex-col items-center gap-3" style={glass}>
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#8B5CF6" }}></div>
          <p className="text-sm" style={{ color: "#94a3b8" }}>{t("common.loading", lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "#050510" }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("dash.title", lang)}</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: "#a78bfa",
            }}>
              {isAdmin ? "👑 ADMIN" : user?.plan?.toUpperCase()}
            </span>
            {isAdmin && (
              <button onClick={() => onNav("admin")} className="text-xs px-3 py-1.5 text-white rounded-xl font-semibold transition-all" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>
                ⚙️ Admin Panel
              </button>
            )}
            {!isProOrBusiness && !isAdmin && (
              <button onClick={() => onNav("pricing")} className="text-xs px-3 py-1.5 text-white rounded-xl font-semibold transition-all" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>
                ↑ {t("dash.upgrade", lang)}
              </button>
            )}
            {(isProOrBusiness || isAdmin) && (
              <button onClick={handleManageSub} className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all" style={{ ...glassBright, color: "#a78bfa" }}>
                ⚙️ {t("dash.manage_sub", lang)}
              </button>
            )}
            <button onClick={() => loadData(true)} disabled={refreshing} className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50" style={{ ...glassBright, color: "#94a3b8" }}>
              {refreshing ? "⟳" : "↻"} {t("dash.refresh", lang)}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("dash.total", lang), value: stats?.totalScanned ?? "—", icon: "🔍", grad: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.3)" },
            { label: t("dash.safe", lang), value: stats?.safeTokens ?? "—", icon: "✅", grad: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.3)" },
            { label: t("dash.risky", lang), value: stats?.riskyTokens ?? "—", icon: "⚠️", grad: "from-red-500 to-rose-600", glow: "rgba(239,68,68,0.3)" },
            { label: t("dash.wallets", lang), value: stats?.totalWallets ?? "—", icon: "👛", grad: "from-orange-500 to-amber-600", glow: "rgba(249,115,22,0.3)" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className={`bg-gradient-to-br ${s.grad} p-4`} style={{ boxShadow: `inset 0 0 20px ${s.glow}` }}>
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-white text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
              </div>
              <div className="px-4 py-2.5"><p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Safe/Risky bar */}
        {stats && stats.totalScanned > 0 && (
          <div className="rounded-2xl p-5" style={glass}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>
              {lang === "fr" ? "Répartition SAFE / RISKY" : "SAFE / RISKY Breakdown"}
            </p>
            <div className="h-3 rounded-full overflow-hidden flex gap-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${(stats.safeTokens / stats.totalScanned) * 100}%` }} />
              <div className="bg-gradient-to-r from-red-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${(stats.riskyTokens / stats.totalScanned) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: "#64748b" }}>
              <span>✅ SAFE: {stats.safeTokens} ({((stats.safeTokens / stats.totalScanned) * 100).toFixed(1)}%)</span>
              <span>⚠️ RISKY: {stats.riskyTokens}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 mb-0 rounded-t-2xl p-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}>
            {[
              { id: "tokens" as const, label: t("dash.tokens_tab", lang), icon: "✅", count: tokens.length },
              { id: "wallets" as const, label: t("dash.wallets_tab", lang), icon: "⚠️", count: wallets.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMainTab(tab.id); setSearch(""); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={mainTab === tab.id
                  ? { background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)", color: "white", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }
                  : { color: "#64748b" }}
              >
                {tab.icon} {tab.label}
                <span className="text-xs px-2 py-0.5 rounded-full" style={mainTab === tab.id
                  ? { background: "rgba(255,255,255,0.2)", color: "white" }
                  : { background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tokens table */}
          {mainTab === "tokens" && (
            <div className="rounded-b-2xl rounded-tr-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {!(isProOrBusiness || isAdmin) ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>🔒</div>
                  <p className="text-sm mb-5" style={{ color: "#64748b" }}>{t("dash.locked", lang)}</p>
                  <button onClick={() => onNav("pricing")} className="px-6 py-2.5 text-white text-sm rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>{t("dash.upgrade", lang)} →</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 p-3 overflow-x-auto items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {sourceTabs.map(st => (
                      <button key={st.id} onClick={() => setSourceTab(st.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                        style={sourceTab === st.id
                          ? { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa" }
                          : { color: "#64748b", border: "1px solid transparent" }}>
                        {st.icon} {st.label}
                      </button>
                    ))}
                    <div className="ml-auto">
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("dash.search", lang)}
                        className="rounded-lg px-3 py-1.5 text-xs text-white outline-none w-48"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "rgba(124,58,237,0.08)" }}>
                          {[t("dash.token",lang),t("dash.address",lang),t("dash.score",lang),"Source",t("dash.liquidity",lang),t("dash.top_holder",lang),t("dash.detected",lang),"🔗"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTokens.length===0 ? (
                          <tr><td colSpan={8} className="py-12 text-center text-sm" style={{ color: "#475569" }}>{t("dash.empty_tokens",lang)}</td></tr>
                        ) : filteredTokens.map((tk:any) => {
                          const score=tk.token_score||0;
                          const scoreStyle=score>=80 ? { background:"rgba(16,185,129,0.15)", color:"#34d399", border:"1px solid rgba(16,185,129,0.3)" } : score>=60 ? { background:"rgba(234,179,8,0.15)", color:"#fbbf24", border:"1px solid rgba(234,179,8,0.3)" } : { background:"rgba(239,68,68,0.15)", color:"#f87171", border:"1px solid rgba(239,68,68,0.3)" };
                          const thPct=tk.top_holder_pct||0;
                          const src=(tk.source||"dexscreener").replace(/_/g," ");
                          return (
                            <tr key={tk.token_address} className="transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                              onMouseEnter={e=>(e.currentTarget.style.background="rgba(124,58,237,0.05)")}
                              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                              <td className="px-4 py-3 font-semibold text-white">{tk.token_name||"Unknown"}</td>
                              <td className="px-4 py-3 font-mono text-xs" style={{ color: "#64748b" }}>{fmt(tk.token_address)}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={scoreStyle}>{score}/100</span></td>
                              <td className="px-4 py-3 text-xs font-medium capitalize" style={{ color: "#a78bfa" }}>{src}</td>
                              <td className="px-4 py-3 font-medium" style={{ color: "#34d399" }}>{fmtLiq(tk.liquidity)}</td>
                              <td className="px-4 py-3 font-medium" style={{ color: thPct>30?"#f87171":"#64748b" }}>{thPct?thPct.toFixed(1)+"%":"—"}</td>
                              <td className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{fmtDate(tk.scanned_at)}</td>
                              <td className="px-4 py-3">
                                <a href={`https://dexscreener.com/solana/${tk.token_address}`} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-xs transition-all"
                                  style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>↗</a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredTokens.length>0 && <div className="px-4 py-2.5 text-xs text-right" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#475569" }}>{filteredTokens.length} token(s)</div>}
                </>
              )}
            </div>
          )}

          {/* Wallets table */}
          {mainTab === "wallets" && (
            <div className="rounded-b-2xl rounded-tr-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {!(isBusiness||isAdmin) ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>🔒</div>
                  <p className="text-sm mb-5" style={{ color: "#64748b" }}>{t("dash.locked_wallets",lang)}</p>
                  <button onClick={()=>onNav("pricing")} className="px-6 py-2.5 text-white text-sm rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>{t("dash.upgrade",lang)} →</button>
                </div>
              ) : (
                <>
                  <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("dash.search",lang)}
                      className="rounded-lg px-3 py-1.5 text-xs text-white outline-none w-64"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "rgba(124,58,237,0.08)" }}>
                          {[t("dash.wallet",lang),t("dash.win_rate",lang),t("dash.transactions",lang),t("dash.detected",lang),"🔗"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWallets.length===0 ? (
                          <tr><td colSpan={5} className="py-12 text-center" style={{ color: "#475569" }}>{t("dash.empty_wallets",lang)}</td></tr>
                        ) : filteredWallets.map((w:any) => {
                          const rate=parseFloat(w.win_rate)||0;
                          const rateStyle=rate>=80 ? { background:"rgba(239,68,68,0.15)", color:"#f87171", border:"1px solid rgba(239,68,68,0.3)" } : { background:"rgba(234,179,8,0.15)", color:"#fbbf24", border:"1px solid rgba(234,179,8,0.3)" };
                          return (
                            <tr key={w.wallet_address} className="transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                              onMouseEnter={e=>(e.currentTarget.style.background="rgba(124,58,237,0.05)")}
                              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                              <td className="px-4 py-3 font-mono text-xs" style={{ color: "#94a3b8" }}>{fmt(w.wallet_address,8)}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={rateStyle}>{rate.toFixed(1)}%</span></td>
                              <td className="px-4 py-3" style={{ color: "#64748b" }}>{w.total_transactions}</td>
                              <td className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{fmtDate(w.detected_at)}</td>
                              <td className="px-4 py-3">
                                <a href={`https://solscan.io/account/${w.wallet_address}`} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-xs"
                                  style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>↗</a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
      }
