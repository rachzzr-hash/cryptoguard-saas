import { useState, useEffect, useCallback } from "react";
import { t, type Lang } from "../i18n";
import StatCard from "../components/StatCard";

interface DashboardProps {
  lang: Lang;
  user: any;
  token: string;
  onNav: (p: string) => void;
}

function apiFetch(path: string, token: string) {
  return fetch(`/api/dashboard${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
}

function fmt(addr: string, n = 6) {
  if (!addr) return "—";
  return addr.slice(0, n) + "..." + addr.slice(-4);
}
function fmtLiq(v: number) {
  if (!v) return "—";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + v.toFixed(0);
}
function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard({ lang, user, token, onNav }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [tab, setTab] = useState<"tokens" | "wallets">("tokens");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isProOrBusiness = user?.plan === "pro" || user?.plan === "business";
  const isBusiness = user?.plan === "business";

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const statsData = await apiFetch("/stats", token);
      setStats(statsData);

      if (isProOrBusiness) {
        const tokensData = await apiFetch("/safe-tokens", token);
        setTokens(Array.isArray(tokensData) ? tokensData : []);
      } else {
        const preview = await apiFetch("/preview-tokens", token);
        setTokens(Array.isArray(preview) ? preview : []);
      }

      if (isBusiness) {
        const walletsData = await apiFetch("/rug-wallets", token);
        setWallets(Array.isArray(walletsData) ? walletsData : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isProOrBusiness, isBusiness]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleManageSub() {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {}
  }

  const filteredTokens = tokens.filter(
    (t) =>
      !search ||
      (t.token_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.token_address || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredWallets = wallets.filter(
    (w) => !search || (w.wallet_address || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-gray-400">{t("common.loading", lang)}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] pb-16" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{t("dash.title", lang)}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Plan badge */}
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              isBusiness ? "bg-purple-900/50 text-purple-300 border border-purple-600/30" :
              isProOrBusiness ? "bg-blue-900/50 text-blue-300 border border-blue-600/30" :
              "bg-gray-800 text-gray-400 border border-gray-600/30"
            }`}>
              {user?.plan?.toUpperCase()}
            </span>
            {!isProOrBusiness && (
              <button
                onClick={() => onNav("pricing")}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md"
              >
                ↑ {t("dash.upgrade", lang)}
              </button>
            )}
            {isProOrBusiness && (
              <button
                onClick={handleManageSub}
                className="text-xs px-3 py-1.5 bg-[#1c2130] border border-[#30363d] text-gray-300 hover:text-white rounded-md"
              >
                ⚙️ {t("dash.manage_sub", lang)}
              </button>
            )}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="text-xs px-3 py-1.5 bg-[#1c2130] border border-[#30363d] text-gray-300 hover:text-white rounded-md disabled:opacity-50"
            >
              {refreshing ? "…" : "↻"} {t("dash.refresh", lang)}
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t("dash.total", lang)} value={stats?.totalScanned ?? "—"} icon="📊" />
          <StatCard label={t("dash.safe", lang)} value={stats?.safeTokens ?? "—"} icon="✅" color="green" />
          <StatCard label={t("dash.risky", lang)} value={stats?.riskyTokens ?? "—"} icon="⚠️" color="red" />
          <StatCard label={t("dash.wallets", lang)} value={stats?.totalWallets ?? "—"} icon="👛" color="orange" />
        </div>

        {/* PROGRESS BAR */}
        {stats && stats.totalScanned > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2">
              {lang === "fr" ? "Répartition SAFE / RISKY" : lang === "en" ? "SAFE / RISKY Breakdown" : "Distribución SAFE / RISKY"}
            </p>
            <div className="h-2 rounded-full bg-[#1c2130] overflow-hidden flex">
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${(stats.safeTokens / stats.totalScanned) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${(stats.riskyTokens / stats.totalScanned) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1.5">
              <span>✅ SAFE: {stats.safeTokens} ({((stats.safeTokens / stats.totalScanned) * 100).toFixed(1)}%)</span>
              <span>⚠️ RISKY: {stats.riskyTokens}</span>
            </div>
          </div>
        )}

        {/* TABS */}
        <div>
          <div className="flex border-b border-[#30363d] mb-0">
            <button
              onClick={() => { setTab("tokens"); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "tokens" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              ✅ {t("dash.tokens_tab", lang)}
              <span className="bg-[#1c2130] text-gray-400 text-xs px-2 py-0.5 rounded-full">{tokens.length}</span>
            </button>
            <button
              onClick={() => { setTab("wallets"); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "wallets" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              ⚠️ {t("dash.wallets_tab", lang)}
              <span className="bg-[#1c2130] text-gray-400 text-xs px-2 py-0.5 rounded-full">{wallets.length}</span>
            </button>
          </div>

          {/* TOKEN TABLE */}
          {tab === "tokens" && (
            <div className="bg-[#161b22] border border-[#30363d] border-t-0 rounded-b-xl overflow-hidden">
              {!isProOrBusiness ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-gray-400 mb-4">{t("dash.locked", lang)}</p>
                  <button onClick={() => onNav("pricing")} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">
                    {t("dash.upgrade", lang)} →
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-[#30363d]">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("dash.search", lang)}
                      className="w-full max-w-sm bg-[#0f1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#0f1117]/50">
                          <th className="text-left text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.token", lang)}</th>
                          <th className="text-left text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.address", lang)}</th>
                          <th className="text-center text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.score", lang)}</th>
                          <th className="text-right text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.liquidity", lang)}</th>
                          <th className="text-right text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.top_holder", lang)}</th>
                          <th className="text-right text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.detected", lang)}</th>
                          <th className="text-center text-xs uppercase tracking-wider text-gray-500 px-4 py-3">🔗</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTokens.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-gray-600">{t("dash.empty_tokens", lang)}</td>
                          </tr>
                        ) : (
                          filteredTokens.map((token: any) => {
                            const score = token.token_score || 0;
                            const scoreClass = score >= 80 ? "bg-green-900/40 text-green-300 border-green-600/30" :
                              score >= 60 ? "bg-yellow-900/40 text-yellow-300 border-yellow-600/30" :
                              "bg-red-900/40 text-red-300 border-red-600/30";
                            const thPct = token.top_holder_pct || 0;
                            return (
                              <tr key={token.token_address} className="border-t border-[#30363d]/50 hover:bg-[#1c2130]/50">
                                <td className="px-4 py-3">
                                  <span className="text-white text-sm font-medium">{token.token_name || "Unknown"}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono text-xs text-gray-500">{fmt(token.token_address)}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${scoreClass}`}>
                                    {score}/100
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-green-400 text-sm">{fmtLiq(token.liquidity)}</td>
                                <td className={`px-4 py-3 text-right text-sm ${thPct > 30 ? "text-red-400" : "text-gray-400"}`}>
                                  {thPct ? thPct.toFixed(1) + "%" : "—"}
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-gray-500">{fmtDate(token.scanned_at)}</td>
                                <td className="px-4 py-3 text-center">
                                  <a
                                    href={`https://dexscreener.com/solana/${token.token_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#1c2130] text-gray-400 hover:text-white text-xs"
                                  >
                                    ↗
                                  </a>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredTokens.length > 0 && (
                    <div className="px-4 py-2 text-xs text-gray-600 text-right border-t border-[#30363d]/50">
                      {filteredTokens.length} token(s)
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* WALLET TABLE */}
          {tab === "wallets" && (
            <div className="bg-[#161b22] border border-[#30363d] border-t-0 rounded-b-xl overflow-hidden">
              {!isBusiness ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-gray-400 mb-4">{t("dash.locked_wallets", lang)}</p>
                  <button onClick={() => onNav("pricing")} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg">
                    {t("dash.upgrade", lang)} →
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-[#30363d]">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("dash.search", lang)}
                      className="w-full max-w-sm bg-[#0f1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#0f1117]/50">
                          <th className="text-left text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.wallet", lang)}</th>
                          <th className="text-center text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.win_rate", lang)}</th>
                          <th className="text-center text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.transactions", lang)}</th>
                          <th className="text-right text-xs uppercase tracking-wider text-gray-500 px-4 py-3">{t("dash.detected", lang)}</th>
                          <th className="text-center text-xs uppercase tracking-wider text-gray-500 px-4 py-3">🔗</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWallets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-gray-600">{t("dash.empty_wallets", lang)}</td>
                          </tr>
                        ) : (
                          filteredWallets.map((w: any) => {
                            const rate = parseFloat(w.win_rate) || 0;
                            const rateClass = rate >= 80 ? "bg-red-900/40 text-red-300 border-red-600/30" : "bg-yellow-900/40 text-yellow-300 border-yellow-600/30";
                            return (
                              <tr key={w.wallet_address} className="border-t border-[#30363d]/50 hover:bg-[#1c2130]/50">
                                <td className="px-4 py-3">
                                  <span className="font-mono text-xs text-gray-300">{fmt(w.wallet_address, 8)}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${rateClass}`}>
                                    {rate.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400 text-sm">{w.total_transactions}</td>
                                <td className="px-4 py-3 text-right text-xs text-gray-500">{fmtDate(w.detected_at)}</td>
                                <td className="px-4 py-3 text-center">
                                  <a
                                    href={`https://solscan.io/account/${w.wallet_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#1c2130] text-gray-400 hover:text-white text-xs"
                                  >
                                    ↗
                                  </a>
                                </td>
                              </tr>
                            );
                          })
                        )}
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
