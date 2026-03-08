import { useState, useEffect, useCallback } from "react";
import { t, type Lang } from "../i18n";

interface DashboardProps { lang: Lang; user: any; token: string; onNav: (p: string) => void; }
function apiFetch(path: string, token: string) { return fetch(`/api/dashboard${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()); }
function fmt(addr: string, n = 6) { if (!addr) return "—"; return addr.slice(0, n) + "..." + addr.slice(-4); }
function fmtLiq(v: number) { if (!v) return "—"; if (v >= 1e6) return "$" + (v/1e6).toFixed(2) + "M"; if (v >= 1e3) return "$" + (v/1e3).toFixed(1) + "K"; return "$" + v.toFixed(0); }
function fmtDate(s: string) { if (!s) return "—"; const d = new Date(s); return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}) + " " + d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}); }
type SourceTab = "all"|"pumpfun"|"axiom"|"performing";

const GRID_BG = {
  background: "#020617",
  backgroundImage: "linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
} as React.CSSProperties;
const CARD = { background: "rgba(15,23,42,0.9)", border: "1px solid rgba(6,182,212,0.25)", backdropFilter: "blur(10px)" } as React.CSSProperties;
const CARD_GREEN = { background: "rgba(6,78,59,0.4)", border: "1px solid rgba(16,185,129,0.35)" } as React.CSSProperties;
const CARD_RED = { background: "rgba(69,10,10,0.5)", border: "1px solid rgba(239,68,68,0.35)" } as React.CSSProperties;
const BTN = { background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", boxShadow: "0 0 20px rgba(6,182,212,0.4)" } as React.CSSProperties;

export default function Dashboard({ lang, user, token, onNav }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [mainTab, setMainTab] = useState<"tokens"|"wallets">("tokens");
  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isProOrBusiness = user?.plan==="pro"||user?.plan==="business";
  const isBusiness = user?.plan==="business";
  const isAdmin = user?.role==="admin";

  const loadData = useCallback(async (silent=false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      setStats(await apiFetch("/stats", token));
      if (isProOrBusiness||isAdmin) setTokens(await apiFetch("/safe-tokens",token).then(d=>Array.isArray(d)?d:[]));
      else setTokens(await apiFetch("/preview-tokens",token).then(d=>Array.isArray(d)?d:[]));
      if (isBusiness||isAdmin) setWallets(await apiFetch("/rug-wallets",token).then(d=>Array.isArray(d)?d:[]));
    } catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  }, [token,isProOrBusiness,isBusiness,isAdmin]);

  useEffect(()=>{ loadData(); const i=setInterval(()=>loadData(true),30000); return()=>clearInterval(i); },[loadData]);

  async function handleManageSub() {
    try { const r=await fetch("/api/stripe/portal",{method:"POST",headers:{Authorization:`Bearer ${token}`}}); const {url}=await r.json(); if(url) window.location.href=url; } catch{}
  }

  const sourceTabs = [{id:"all" as SourceTab,label:"All",icon:"🔍"},{id:"pumpfun" as SourceTab,label:"Pump.fun",icon:"🚀"},{id:"axiom" as SourceTab,label:"Axiom",icon:"⚡"},{id:"performing" as SourceTab,label:"Performing",icon:"📈"}];
  const filtered = tokens.filter(tk=>{ const src=(tk.source||"").toLowerCase(); if(sourceTab==="pumpfun") return src.includes("pump"); if(sourceTab==="axiom") return src.includes("axiom"); if(sourceTab==="performing") return src.includes("performing"); return true; }).filter(tk=>!search||(tk.token_name||"").toLowerCase().includes(search.toLowerCase())||(tk.token_address||"").toLowerCase().includes(search.toLowerCase()));
  const filteredW = wallets.filter(w=>!search||(w.wallet_address||"").toLowerCase().includes(search.toLowerCase()));

  const inputStyle = { background:"rgba(2,6,23,0.8)", border:"1px solid rgba(6,182,212,0.2)", color:"white", outline:"none", borderRadius:"6px", padding:"6px 12px", fontSize:"12px" } as React.CSSProperties;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={GRID_BG}>
      <div className="rounded-xl p-8 flex flex-col items-center gap-3" style={CARD}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{border:"2px solid rgba(6,182,212,0.2)",borderTopColor:"#06b6d4"}}/>
        <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#06b6d4"}}>[ LOADING SYSTEM... ]</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20" style={GRID_BG} dir={lang==="ar"?"rtl":"ltr"}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{color:"#22d3ee"}}>▶ {t("dash.title",lang)}</h1>
            <p className="text-xs mt-0.5 font-mono" style={{color:"#334155"}}>{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1.5 rounded font-bold uppercase tracking-widest" style={{background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.3)",color:"#22d3ee"}}>
              {isAdmin?"👑 ADMIN":user?.plan?.toUpperCase()}
            </span>
            {isAdmin && <button onClick={()=>onNav("admin")} className="text-xs px-3 py-1.5 text-white rounded font-bold uppercase tracking-widest" style={BTN}>⚙️ Admin</button>}
            {!isProOrBusiness&&!isAdmin && <button onClick={()=>onNav("pricing")} className="text-xs px-3 py-1.5 text-white rounded font-bold uppercase tracking-widest" style={BTN}>↑ {t("dash.upgrade",lang)}</button>}
            {(isProOrBusiness||isAdmin) && <button onClick={handleManageSub} className="text-xs px-3 py-1.5 rounded font-bold uppercase tracking-widest" style={{...CARD,color:"#22d3ee"}}>⚙️ {t("dash.manage_sub",lang)}</button>}
            <button onClick={()=>loadData(true)} disabled={refreshing} className="text-xs px-3 py-1.5 rounded font-bold uppercase tracking-widest disabled:opacity-50" style={{...CARD,color:"#94a3b8"}}>
              {refreshing?"⟳":"↻"} {t("dash.refresh",lang)}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {label:t("dash.total",lang), value:stats?.totalScanned??"—", icon:"🔍", color:"#22d3ee", cardStyle:CARD},
            {label:t("dash.safe",lang), value:stats?.safeTokens??"—", icon:"🛡️", color:"#34d399", cardStyle:{...CARD,...CARD_GREEN}},
            {label:t("dash.risky",lang), value:stats?.riskyTokens??"—", icon:"⚠️", color:"#f87171", cardStyle:{...CARD,...CARD_RED}},
            {label:t("dash.wallets",lang), value:stats?.totalWallets??"—", icon:"👛", color:"#fbbf24", cardStyle:{...CARD,border:"1px solid rgba(251,191,36,0.25)"}},
          ].map(s=>(
            <div key={s.label} className="rounded-xl p-4" style={s.cardStyle}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:s.color}}>{s.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-2xl font-bold text-white">{typeof s.value==="number"?s.value.toLocaleString():s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {stats&&stats.totalScanned>0&&(
          <div className="rounded-xl p-4" style={CARD}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:"#06b6d4"}}>
              ► {lang==="fr"?"Répartition SAFE / RISKY":"SAFE / RISKY Breakdown"}
            </p>
            <div className="h-2 rounded-full overflow-hidden flex" style={{background:"rgba(6,182,212,0.1)"}}>
              <div className="bg-emerald-400 transition-all duration-700" style={{width:`${(stats.safeTokens/stats.totalScanned)*100}%`}}/>
              <div className="bg-red-500 transition-all duration-700" style={{width:`${(stats.riskyTokens/stats.totalScanned)*100}%`}}/>
            </div>
            <div className="flex justify-between text-xs mt-2 font-mono" style={{color:"#475569"}}>
              <span style={{color:"#34d399"}}>● SAFE: {stats.safeTokens} ({((stats.safeTokens/stats.totalScanned)*100).toFixed(1)}%)</span>
              <span style={{color:"#f87171"}}>● RISKY: {stats.riskyTokens}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 p-2 rounded-t-xl" style={{background:"rgba(15,23,42,0.7)",border:"1px solid rgba(6,182,212,0.2)",borderBottom:"none"}}>
            {[{id:"tokens" as const,label:t("dash.tokens_tab",lang),icon:"✅",count:tokens.length},{id:"wallets" as const,label:t("dash.wallets_tab",lang),icon:"⚠️",count:wallets.length}].map(tab=>(
              <button key={tab.id} onClick={()=>{setMainTab(tab.id);setSearch("");}}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                style={mainTab===tab.id?{...BTN,color:"white"}:{color:"#475569"}}>
                {tab.icon} {tab.label}
                <span className="px-2 py-0.5 rounded text-xs" style={mainTab===tab.id?{background:"rgba(255,255,255,0.2)",color:"white"}:{background:"rgba(6,182,212,0.1)",color:"#475569"}}>{tab.count}</span>
              </button>
            ))}
          </div>

          {mainTab==="tokens"&&(
            <div className="rounded-b-xl rounded-tr-xl overflow-hidden" style={{...CARD,borderTop:"none"}}>
              {!(isProOrBusiness||isAdmin)?(
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4" style={{background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.3)"}}>🔒</div>
                  <p className="text-sm mb-5" style={{color:"#475569"}}>{t("dash.locked",lang)}</p>
                  <button onClick={()=>onNav("pricing")} className="px-6 py-2.5 text-white text-xs font-bold rounded-lg uppercase tracking-widest" style={BTN}>{t("dash.upgrade",lang)} →</button>
                </div>
              ):(
                <>
                  <div className="flex gap-1 p-3 items-center overflow-x-auto" style={{borderBottom:"1px solid rgba(6,182,212,0.1)"}}>
                    {sourceTabs.map(st=>(
                      <button key={st.id} onClick={()=>setSourceTab(st.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all"
                        style={sourceTab===st.id?{background:"rgba(6,182,212,0.15)",border:"1px solid rgba(6,182,212,0.4)",color:"#22d3ee"}:{color:"#475569",border:"1px solid transparent"}}>
                        {st.icon} {st.label}
                      </button>
                    ))}
                    <div className="ml-auto">
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("dash.search",lang)} style={{...inputStyle,width:"180px"}}/>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{background:"rgba(6,182,212,0.07)"}}>
                          {[t("dash.token",lang),t("dash.address",lang),t("dash.score",lang),"Source",t("dash.liquidity",lang),t("dash.top_holder",lang),t("dash.detected",lang),"🔗"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{color:"#06b6d4"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length===0?(
                          <tr><td colSpan={8} className="py-12 text-center text-xs uppercase tracking-widest" style={{color:"#334155"}}>{t("dash.empty_tokens",lang)}</td></tr>
                        ):filtered.map((tk:any)=>{
                          const score=tk.token_score||0;
                          const sStyle=score>=80?{background:"rgba(16,185,129,0.15)",color:"#34d399",border:"1px solid rgba(16,185,129,0.3)"}:score>=60?{background:"rgba(234,179,8,0.15)",color:"#fbbf24",border:"1px solid rgba(234,179,8,0.3)"}:{background:"rgba(239,68,68,0.15)",color:"#f87171",border:"1px solid rgba(239,68,68,0.3)"};
                          const thPct=tk.top_holder_pct||0;
                          return(
                            <tr key={tk.token_address} style={{borderBottom:"1px solid rgba(6,182,212,0.07)"}}
                              onMouseEnter={e=>(e.currentTarget.style.background="rgba(6,182,212,0.04)")}
                              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                              <td className="px-4 py-3 font-bold text-white">{tk.token_name||"Unknown"}</td>
                              <td className="px-4 py-3 font-mono text-xs" style={{color:"#334155"}}>{fmt(tk.token_address)}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold" style={sStyle}>{score}/100</span></td>
                              <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{color:"#06b6d4"}}>{(tk.source||"dex").replace(/_/g," ")}</td>
                              <td className="px-4 py-3 font-bold font-mono" style={{color:"#34d399"}}>{fmtLiq(tk.liquidity)}</td>
                              <td className="px-4 py-3 font-mono" style={{color:thPct>30?"#f87171":"#475569"}}>{thPct?thPct.toFixed(1)+"%":"—"}</td>
                              <td className="px-4 py-3 text-xs font-mono" style={{color:"#334155"}}>{fmtDate(tk.scanned_at)}</td>
                              <td className="px-4 py-3">
                                <a href={`https://dexscreener.com/solana/${tk.token_address}`} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 inline-flex items-center justify-center rounded text-xs"
                                  style={{background:"rgba(6,182,212,0.12)",color:"#22d3ee",border:"1px solid rgba(6,182,212,0.3)"}}>↗</a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length>0&&<div className="px-4 py-2 text-xs font-mono text-right" style={{borderTop:"1px solid rgba(6,182,212,0.07)",color:"#334155"}}>{filtered.length} token(s)</div>}
                </>
              )}
            </div>
          )}

          {mainTab==="wallets"&&(
            <div className="rounded-b-xl rounded-tr-xl overflow-hidden" style={{...CARD,borderTop:"none"}}>
              {!(isBusiness||isAdmin)?(
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4" style={{background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.3)"}}>🔒</div>
                  <p className="text-sm mb-5" style={{color:"#475569"}}>{t("dash.locked_wallets",lang)}</p>
                  <button onClick={()=>onNav("pricing")} className="px-6 py-2.5 text-white text-xs font-bold rounded-lg uppercase tracking-widest" style={BTN}>{t("dash.upgrade",lang)} →</button>
                </div>
              ):(
                <>
                  <div className="p-3" style={{borderBottom:"1px solid rgba(6,182,212,0.1)"}}>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("dash.search",lang)} style={{...inputStyle,width:"240px"}}/>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{background:"rgba(6,182,212,0.07)"}}>
                          {[t("dash.wallet",lang),t("dash.win_rate",lang),t("dash.transactions",lang),t("dash.detected",lang),"🔗"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{color:"#06b6d4"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredW.length===0?(
                          <tr><td colSpan={5} className="py-12 text-center text-xs uppercase tracking-widest" style={{color:"#334155"}}>{t("dash.empty_wallets",lang)}</td></tr>
                        ):filteredW.map((w:any)=>{
                          const rate=parseFloat(w.win_rate)||0;
                          const rStyle=rate>=80?{background:"rgba(239,68,68,0.15)",color:"#f87171",border:"1px solid rgba(239,68,68,0.3)"}:{background:"rgba(234,179,8,0.15)",color:"#fbbf24",border:"1px solid rgba(234,179,8,0.3)"};
                          return(
                            <tr key={w.wallet_address} style={{borderBottom:"1px solid rgba(6,182,212,0.07)"}}
                              onMouseEnter={e=>(e.currentTarget.style.background="rgba(6,182,212,0.04)")}
                              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                              <td className="px-4 py-3 font-mono text-xs" style={{color:"#94a3b8"}}>{fmt(w.wallet_address,8)}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold" style={rStyle}>{rate.toFixed(1)}%</span></td>
                              <td className="px-4 py-3 font-mono" style={{color:"#475569"}}>{w.total_transactions}</td>
                              <td className="px-4 py-3 text-xs font-mono" style={{color:"#334155"}}>{fmtDate(w.detected_at)}</td>
                              <td className="px-4 py-3">
                                <a href={`https://solscan.io/account/${w.wallet_address}`} target="_blank" rel="noopener noreferrer"
                                  className="w-7 h-7 inline-flex items-center justify-center rounded text-xs"
                                  style={{background:"rgba(6,182,212,0.12)",color:"#22d3ee",border:"1px solid rgba(6,182,212,0.3)"}}>↗</a>
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
