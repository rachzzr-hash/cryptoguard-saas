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

  const filteredTokens = sourceFiltered.filter(tk =>
    !search || (tk.token_name || "").toLowerCase().includes(search.toLowerCase()) || (tk.token_address || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredWallets = wallets.filter(w =>
    !search || (w.wallet_address || "").toLowerCase().includes(search.toLowerCase())
  );

  const sourceTabs: { id: SourceTab; label: string; icon: string }[] = [
    { id: "all", label: "All Sources", icon: "🔍" },
    { id: "pumpfun", label: "Pump.fun", icon: "🚀" },
    { id: "axiom", label: "Axiom", icon: "⚡" },
    { id: "performing", label: "Performing", icon: "📈" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f4f4f8 0%, #ede9f6 100%)" }}>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-violet-100 shadow-sm flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-violet-300 border-t-violet-600 rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }}></div>
          <p className="text-gray-500 text-sm">{t("common.loading", lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(135deg, #f4f4f8 0%, #ede9f6 100%)" }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t("dash.title", lang)}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${isBusiness || isAdmin ? "bg-violet-100 text-violet-700 border-violet-200" : isProOrBusiness ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
              {isAdmin ? "👑 ADMIN" : user?.plan?.toUpperCase()}
            </span>
            {isAdmin && (
              <button onClick={() => onNav("admin")} className="text-xs px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
                ⚙️ Admin Panel
              </button>
            )}
            {!isProOrBusiness && !isAdmin && (
              <button onClick={() => onNav("pricing")} className="text-xs px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold">
                ↑ {t("dash.upgrade", lang)}
              </button>
            )}
            {(isProOrBusiness || isAdmin) && (
              <button onClick={handleManageSub} className="text-xs px-3 py-1.5 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-xl font-semibold transition-colors">
                ⚙️ {t("dash.manage_sub", lang)}
              </button>
            )}
            <button onClick={() => loadData(true)} disabled={refreshing} className="text-xs px-3 py-1.5 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-xl font-semibold transition-colors disabled:opacity-50">
              {refreshing ? "⟳" : "↻"} {t("dash.refresh", lang)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("dash.total", lang), value: stats?.totalScanned ?? "—", icon: "🔍", grad: "from-violet-500 to-purple-600" },
            { label: t("dash.safe", lang), value: stats?.safeTokens ?? "—", icon: "✅", grad: "from-emerald-500 to-teal-600" },
            { label: t("dash.risky", lang), value: stats?.riskyTokens ?? "—", icon: "⚠️", grad: "from-red-500 to-rose-600" },
            { label: t("dash.wallets", lang), value: stats?.totalWallets ?? "—", icon: "👛", grad: "from-orange-500 to-amber-600" },
          ].map(s => (
            <div key={s.label} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-br ${s.grad} p-4`}>
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-white text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
              </div>
              <div className="px-4 py-2.5"><p className="text-gray-500 text-xs font-medium">{s.label}</p></div>
            </div>
          ))}
        </div>

        {stats && stats.totalScanned > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-violet-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
              {lang === "fr" ? "Répartition SAFE / RISKY" : "SAFE / RISKY Breakdown"}
            </p>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex gap-0.5">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${(stats.safeTokens / stats.totalScanned) * 100}%` }} />
              <div className="bg-gradient-to-r from-red-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${(stats.riskyTokens / stats.totalScanned) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>✅ SAFE: {stats.safeTokens} ({((stats.safeTokens / stats.totalScanned) * 100).toFixed(1)}%)</span>
              <span>⚠️ RISKY: {stats.riskyTokens}</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex gap-1 mb-0 bg-white/70 backdrop-blur-xl rounded-t-2xl border border-b-0 border-violet-100 p-2">
            <button onClick={() => { setMainTab("tokens"); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mainTab === "tokens" ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md" : "text-gray-500 hover:text-violet-700 hover:bg-violet-50"}`}>
              ✅ {t("dash.tokens_tab", lang)}
              <span className={`text-xs px-2 py-0.5 rounded-full ${mainTab === "tokens" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{tokens.length}</span>
            </button>
            <button onClick={() => { setMainTab("wallets"); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mainTab === "wallets" ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md" : "text-gray-500 hover:text-violet-700 hover:bg-violet-50"}`}>
              ⚠️ {t("dash.wallets_tab", lang)}
              <span className={`text-xs px-2 py-0.5 rounded-full ${mainTab === "wallets" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{wallets.length}</span>
            </button>
          </div>

          {mainTab === "tokens" && (
            <div className="bg-white/80 backdrop-blur-xl border border-violet-100 rounded-b-2xl rounded-tr-2xl shadow-sm overflow-hidden">
              {!(isProOrBusiness || isAdmin) ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
                  <p className="text-gray-500 mb-5 text-sm">{t("dash.locked", lang)}</p>
                  <button onClick={() => onNav("pricing")} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm rounded-xl font-semibold shadow-md">{t("dash.upgrade", lang)} →</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 p-3 border-b border-violet-50 overflow-x-auto items-center">
                    {sourceTabs.map(st => (
                      <button key={st.id} onClick={() => setSourceTab(st.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${sourceTab === st.id ? "bg-violet-100 text-violet-700 border border-violet-200" : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"}`}>
                        {st.icon} {st.label}
                      </button>
                    ))}
                    <div className="ml-auto">
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("dash.search", lang)}
                        className="border border-violet-200 bg-violet-50 focus:bg-white rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none w-48" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-violet-50">
                        <tr>
                          {[t("dash.token",lang),t("dash.address",lang),t("dash.score",lang),"Source",t("dash.liquidity",lang),t("dash.top_holder",lang),t("dash.detected",lang),"🔗"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredTokens.length===0?(
                          <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">{t("dash.empty_tokens",lang)}</td></tr>
                        ):filteredTokens.map((tk:any)=>{
                          const score=tk.token_score||0;
                          const scoreClass=score>=80?"bg-emerald-100 text-emerald-700":score>=60?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700";
                          const thPct=tk.top_holder_pct||0;
                          const src=(tk.source||"dexscreener").replace(/_/g," ");
                          return(
                            <tr key={tk.token_address} className="hover:bg-violet-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-800">{tk.token_name||"Unknown"}</td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-400">{fmt(tk.token_address)}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreClass}`}>{score}/100</span></td>
                              <td className="px-4 py-3 text-xs text-violet-600 font-medium capitalize">{src}</td>
                              <td className="px-4 py-3 text-emerald-600 font-medium">{fmtLiq(tk.liquidity)}</td>
                              <td className={`px-4 py-3 font-medium ${thPct>30?"text-red-500":"text-gray-500"}`}>{thPct?thPct.toFixed(1)+"%":"—"}</td>
                              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(tk.scanned_at)}</td>
                              <td className="px-4 py-3">
                                <a href={`https://dexscreener.com/solana/${tk.token_address}`} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 inline-flex items-center justify-center bg-violet-100 text-violet-600 hover:bg-violet-200 rounded-lg text-xs">↗</a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredTokens.length>0&&<div className="px-4 py-2.5 text-xs text-gray-400 text-right border-t border-violet-50">{filteredTokens.length} token(s)</div>}
                </>
              )}
            </div>
          )}

          {mainTab === "wallets" && (
            <div className="bg-white/80 backdrop-blur-xl border border-violet-100 rounded-b-2xl rounded-tr-2xl shadow-sm overflow-hidden">
              {!(isBusiness||isAdmin)?(
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
                  <p className="text-gray-500 mb-5 text-sm">{t("dash.locked_wallets",lang)}</p>
                  <button onClick={()=>onNav("pricing")} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm rounded-xl font-semibold shadow-md">{t("dash.upgrade",lang)} →</button>
                </div>
              ):(
                <>
                  <div className="p-3 border-b border-violet-50">
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("dash.search",lang)}
                      className="border border-violet-200 bg-violet-50 focus:bg-white rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none w-64" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-violet-50">
                        <tr>
                          {[t("dash.wallet",lang),t("dash.win_rate",lang),t("dash.transactions",lang),t("dash.detected",lang),"🔗"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredWallets.length===0?(
                          <tr><td colSpan={5} className="py-12 text-center text-gray-400">{t("dash.empty_wallets",lang)}</td></tr>
                        ):filteredWallets.map((w:any)=>{
                          const rate=parseFloat(w.win_rate)||0;
                          const rateClass=rate>=80?"bg-red-100 text-red-700":"bg-yellow-100 text-yellow-700";
                          return(
                            <tr key={w.wallet_address} className="hover:bg-violet-50/50 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-gray-600">{fmt(w.wallet_address,8)}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rateClass}`}>{rate.toFixed(1)}%</span></td>
                              <td className="px-4 py-3 text-gray-500">{w.total_transactions}</td>
                              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(w.detected_at)}</td>
                              <td className="px-4 py-3">
                                <a href={`https://solscan.io/account/${w.wallet_address}`} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 inline-flex items-center justify-center bg-violet-100 text-violet-600 hover:bg-violet-200 rounded-lg text-xs">↗</a>
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
