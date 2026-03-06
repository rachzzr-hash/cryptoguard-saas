import { useState, useEffect } from "react";

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

interface FloatingCryptoWidgetProps {
  onNav?: (page: string) => void;
}

export default function FloatingCryptoWidget({ onNav }: FloatingCryptoWidgetProps) {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [trendingTokens, setTrendingTokens] = useState<any[]>([]);

  const fetchPrices = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum,bonk,jito-governance-token&vs_currencies=usd&include_24hr_change=true"
      );
      const data = await res.json();
      const list: CryptoPrice[] = [
        { symbol: "SOL", name: "Solana", price: data.solana?.usd || 0, change24h: data.solana?.usd_24h_change || 0, icon: "◎" },
        { symbol: "BTC", name: "Bitcoin", price: data.bitcoin?.usd || 0, change24h: data.bitcoin?.usd_24h_change || 0, icon: "₿" },
        { symbol: "ETH", name: "Ethereum", price: data.ethereum?.usd || 0, change24h: data.ethereum?.usd_24h_change || 0, icon: "Ξ" },
        { symbol: "BONK", name: "Bonk", price: data.bonk?.usd || 0, change24h: data.bonk?.usd_24h_change || 0, icon: "🐕" },
        { symbol: "JTO", name: "Jito", price: data["jito-governance-token"]?.usd || 0, change24h: data["jito-governance-token"]?.usd_24h_change || 0, icon: "⚡" },
      ];
      setPrices(list);
      setSolPrice(data.solana?.usd || 0);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {}
    setLoading(false);
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
      const data = await res.json();
      const coins = (data.coins || []).slice(0, 4).map((c: any) => ({
        name: c.item.name,
        symbol: c.item.symbol,
        rank: c.item.market_cap_rank,
        thumb: c.item.thumb,
      }));
      setTrendingTokens(coins);
    } catch {}
  };

  useEffect(() => {
    fetchPrices();
    fetchTrending();
    const interval = setInterval(() => {
      fetchPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return p.toFixed(2);
    if (p >= 0.01) return p.toFixed(4);
    return p.toFixed(8);
  };

  return (
    <>
      {/* Widget flottant principal - coin bas gauche */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        {/* Carte SOL rapide toujours visible */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer bg-white/90 backdrop-blur-xl border border-violet-200 rounded-2xl px-4 py-3 shadow-xl hover:shadow-violet-200/50 transition-all duration-300 min-w-[160px]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">◎</div>
              <div>
                <div className="text-xs text-gray-400 font-medium">SOL/USD</div>
                <div className="text-base font-bold text-gray-800">${formatPrice(solPrice)}</div>
              </div>
            </div>
            <div className={prices[0]?.change24h >= 0 ? "text-emerald-500 text-xs font-bold" : "text-red-500 text-xs font-bold"}>
              {prices[0]?.change24h >= 0 ? "▲" : "▼"} {Math.abs(prices[0]?.change24h || 0).toFixed(2)}%
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-gray-400">Live • {lastUpdate}</span>
            <span className="text-violet-500 text-xs">{expanded ? "▾" : "▸"}</span>
          </div>
        </div>

        {/* Panel étendu */}
        {expanded && (
          <div className="bg-white/95 backdrop-blur-xl border border-violet-200 rounded-2xl shadow-2xl shadow-violet-100 overflow-hidden w-72 animate-in slide-in-from-bottom-2">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">📡 Marchés en direct</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-white/70 text-xs">Live</span>
                </div>
              </div>
            </div>

            {/* Prix */}
            <div className="p-3 space-y-2">
              {prices.map((coin) => (
                <div key={coin.symbol} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-violet-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-sm">
                      {coin.icon}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{coin.symbol}</div>
                      <div className="text-gray-400 text-[10px]">{coin.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 text-sm">${formatPrice(coin.price)}</div>
                    <div className={coin.change24h >= 0 ? "text-emerald-500 text-xs font-semibold" : "text-red-500 text-xs font-semibold"}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trending */}
            {trendingTokens.length > 0 && (
              <div className="px-3 pb-3">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-2 px-1">🔥 Trending Global</div>
                <div className="grid grid-cols-2 gap-1">
                  {trendingTokens.map((t, i) => (
                    <div key={i} className="flex items-center gap-1 p-1.5 rounded-lg bg-violet-50 border border-violet-100">
                      <img src={t.thumb} alt={t.symbol} className="w-4 h-4 rounded-full" onError={(e: any) => e.target.style.display='none'} />
                      <span className="text-xs font-semibold text-gray-700 truncate">{t.symbol}</span>
                      {t.rank && <span className="text-[9px] text-gray-400 ml-auto">#{t.rank}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Données via CoinGecko</span>
              <button
                onClick={() => fetchPrices()}
                className="text-[10px] text-violet-500 hover:text-violet-700 font-semibold"
              >
                ↺ Actualiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Widget flottant - coin bas droit : Fear & Greed simplifié */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white/90 backdrop-blur-xl border border-violet-200 rounded-2xl px-4 py-3 shadow-xl min-w-[140px]">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Marché Solana</div>
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f3e8ff" strokeWidth="4"/>
                <circle cx="18" cy="18" r="14" fill="none" stroke="url(#grad)" strokeWidth="4"
                  strokeDasharray="62 88" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-violet-600">🔥</div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">Haussier</div>
              <div className="text-[10px] text-gray-400">Sentiment global</div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <div className="text-center bg-violet-50 rounded-lg p-1">
              <div className="text-xs font-bold text-violet-600">SOL</div>
              <div className="text-[10px] text-gray-500">Chain #1</div>
            </div>
            <div className="text-center bg-emerald-50 rounded-lg p-1">
              <div className="text-xs font-bold text-emerald-600">PUMP</div>
              <div className="text-[10px] text-gray-500">Actif</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
