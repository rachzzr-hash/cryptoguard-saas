import fetch from "node-fetch";
import { getPool } from "./db.js";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// ---- DEXSCREENER ----
async function getDexScreenerTokens(): Promise<any[]> {
  try {
    const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1");
    const data = await res.json() as any[];
    return (data || []).filter((t: any) => t.chainId === "solana").slice(0, 30);
  } catch { return []; }
}

async function getDexScreenerPairs(tokenAddress: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await res.json() as any;
    const pairs = (data?.pairs || []).filter((p: any) => p.chainId === "solana");
    return pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
  } catch { return null; }
}

// ---- PUMP.FUN ----
async function getPumpFunNewTokens(): Promise<any[]> {
  try {
    const res = await fetch("https://frontend-api.pump.fun/coins?offset=0&limit=30&sort=created_timestamp&order=DESC&includeNsfw=false");
    const data = await res.json() as any[];
    return (data || []).map((t: any) => ({
      tokenAddress: t.mint,
      name: t.name || "Unknown",
      symbol: t.symbol || "",
      marketCap: t.usd_market_cap || 0,
      liquidity: (t.virtual_sol_reserves || 0) * 150,
      source: "pumpfun",
      graduated: t.complete || false,
      replies: t.reply_count || 0,
      holders: t.holder_count || 0,
    }));
  } catch { return []; }
}

async function getPumpFunTrendingTokens(): Promise<any[]> {
  try {
    const res = await fetch("https://frontend-api.pump.fun/coins?offset=0&limit=20&sort=market_cap&order=DESC&includeNsfw=false");
    const data = await res.json() as any[];
    return (data || []).map((t: any) => ({
      tokenAddress: t.mint,
      name: t.name || "Unknown",
      symbol: t.symbol || "",
      marketCap: t.usd_market_cap || 0,
      liquidity: (t.virtual_sol_reserves || 0) * 150,
      source: "pumpfun_trending",
      graduated: t.complete || false,
    }));
  } catch { return []; }
}

// ---- AXIOM / RAYDIUM LAUNCHPAD ----
async function getAxiomNewTokens(): Promise<any[]> {
  try {
    // Axiom uses Raydium launchpad - fetch via DexScreener filtering by new listings
    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=solana");
    const data = await res.json() as any;
    const pairs = (data?.pairs || [])
      .filter((p: any) => p.chainId === "solana" && p.dexId === "raydium")
      .filter((p: any) => {
        const age = Date.now() - (p.pairCreatedAt || 0);
        return age < 3600000 * 6; // less than 6 hours old
      })
      .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 20);
    return pairs.map((p: any) => ({
      tokenAddress: p.baseToken?.address,
      name: p.baseToken?.name || "Unknown",
      symbol: p.baseToken?.symbol || "",
      marketCap: p.fdv || 0,
      liquidity: p.liquidity?.usd || 0,
      volume24h: p.volume?.h24 || 0,
      priceChange24h: p.priceChange?.h24 || 0,
      source: "axiom_raydium",
    }));
  } catch { return []; }
}

async function getAxiomPerformingTokens(): Promise<any[]> {
  try {
    // Top performing tokens by volume on Raydium/Orca in last 24h
    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=sol");
    const data = await res.json() as any;
    const pairs = (data?.pairs || [])
      .filter((p: any) => p.chainId === "solana")
      .filter((p: any) => (p.volume?.h24 || 0) > 50000 && (p.liquidity?.usd || 0) > 10000)
      .filter((p: any) => (p.priceChange?.h24 || 0) > 20) // +20% in 24h
      .sort((a: any, b: any) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0))
      .slice(0, 15);
    return pairs.map((p: any) => ({
      tokenAddress: p.baseToken?.address,
      name: p.baseToken?.name || "Unknown",
      symbol: p.baseToken?.symbol || "",
      marketCap: p.fdv || 0,
      liquidity: p.liquidity?.usd || 0,
      volume24h: p.volume?.h24 || 0,
      priceChange24h: p.priceChange?.h24 || 0,
      source: "performing",
    }));
  } catch { return []; }
}

// ---- RUGCHECK ----
async function getRugCheckScore(tokenAddress: string): Promise<{ score: number; topHolder: number } | null> {
  try {
    const res = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const risks = data?.risks || [];
    let score = 100;
    for (const r of risks) {
      if (r.level === "danger") score -= 30;
      else if (r.level === "warn") score -= 10;
      else if (r.level === "info") score -= 2;
    }
    return {
      score: Math.max(0, Math.min(100, score)),
      topHolder: (data?.topHolders?.[0]?.pct || 0) * 100,
    };
  } catch { return null; }
}

// ---- PROCESS TOKEN ----
async function processToken(addr: string, name: string, source: string, extraData: any = {}): Promise<"safe"|"risky"|"skip"> {
  const db = getPool();
  try {
    const [exists] = await db.query("SELECT id FROM scanned_tokens WHERE token_address=?", [addr]) as any[];
    if ((exists as any[]).length > 0) return "skip";

    const pair = await getDexScreenerPairs(addr);
    const liquidity = pair?.liquidity?.usd || extraData.liquidity || 0;

    if (liquidity < 500) {
      await db.query(
        "INSERT IGNORE INTO scanned_tokens (token_address, token_name, status, source) VALUES (?, ?, 'RISKY', ?)",
        [addr, name.substring(0, 191), source]
      );
      return "risky";
    }

    const rugcheck = await getRugCheckScore(addr);
    const score = rugcheck?.score ?? 50;
    const topHolder = rugcheck?.topHolder ?? 0;
    const isSafe = score >= 50 && topHolder < 40;
    const status = isSafe ? "SAFE" : "RISKY";

    await db.query(
      `INSERT INTO scanned_tokens (token_address, token_name, token_score, liquidity, top_holder_pct, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE token_score=VALUES(token_score), status=VALUES(status)`,
      [addr, name.substring(0, 191), score, liquidity, topHolder, status, source]
    );

    return isSafe ? "safe" : "risky";
  } catch { return "skip"; }
}

// ---- SCANNER PRINCIPAL ----
export async function runScanner(): Promise<void> {
  console.log("\n[Scanner] Scan en cours...");
  const db = getPool();

  // 1. DexScreener latest
  const dexTokens = await getDexScreenerTokens();
  // 2. Pump.fun new + trending
  const pumpNew = await getPumpFunNewTokens();
  const pumpTrending = await getPumpFunTrendingTokens();
  // 3. Axiom/Raydium new + performing
  const axiomNew = await getAxiomNewTokens();
  const axiomPerforming = await getAxiomPerformingTokens();

  const allTokens = [
    ...dexTokens.map((t: any) => ({ addr: t.tokenAddress || t.address, name: t.description || t.name || "Unknown", source: "dexscreener", extra: {} })),
    ...pumpNew.map((t: any) => ({ addr: t.tokenAddress, name: t.name, source: "pumpfun", extra: t })),
    ...pumpTrending.map((t: any) => ({ addr: t.tokenAddress, name: t.name, source: "pumpfun_trending", extra: t })),
    ...axiomNew.map((t: any) => ({ addr: t.tokenAddress, name: t.name, source: "axiom_new", extra: t })),
    ...axiomPerforming.map((t: any) => ({ addr: t.tokenAddress, name: t.name, source: "performing", extra: t })),
  ].filter(t => t.addr);

  let safe = 0, risky = 0, skipped = 0;

  for (const token of allTokens) {
    const result = await processToken(token.addr, token.name, token.source, token.extra);
    if (result === "safe") { safe++; console.log(`[Scanner] SAFE: ${token.name} [${token.source}]`); }
    else if (result === "risky") risky++;
    else skipped++;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`[Scanner] Resultat: ${safe} SAFE | ${risky} RISKY | ${skipped} ignorés (${allTokens.length} total)`);
}

// ---- RUGGER DETECTOR ----
export async function runRuggerDetector(): Promise<void> {
  console.log("\n[Rugger] Detection ruggers...");
  const db = getPool();
  const [riskyTokens] = await db.query(
    "SELECT token_address FROM scanned_tokens WHERE status='RISKY' ORDER BY scanned_at DESC LIMIT 10"
  ) as any[];

  let walletCount = 0;
  for (const token of riskyTokens as any[]) {
    try {
      const res = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSignaturesForAddress", params: [token.token_address, { limit: 100 }] }),
      });
      const data = await res.json() as any;
      const txns = data?.result || [];
      const wallets = [...new Set(txns.map((t: any) => t.memo).filter(Boolean))].slice(0, 5) as string[];

      for (const wallet of wallets) {
        const [known] = await db.query("SELECT id FROM bundle_wallets WHERE wallet_address=?", [wallet]) as any[];
        if ((known as any[]).length > 0) continue;

        const wRes = await fetch(HELIUS_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSignaturesForAddress", params: [wallet, { limit: 50 }] }),
        });
        const wData = await wRes.json() as any;
        const wTxns = wData?.result || [];
        if (wTxns.length < 10) continue;

        const winRate = (wTxns.filter((t: any) => !t.err).length / wTxns.length) * 100;
        if (winRate > 50) {
          await db.query(
            "INSERT IGNORE INTO bundle_wallets (wallet_address, win_rate, total_transactions) VALUES (?, ?, ?)",
            [wallet, winRate.toFixed(1), wTxns.length]
          );
          walletCount++;
        }
      }
    } catch (err) { console.error("[Rugger] Erreur:", err); }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`[Rugger] ${walletCount} nouveaux wallets détectés`);
}
