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
  } catch {
    return [];
  }
}

async function getDexScreenerPairs(tokenAddress: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await res.json() as any;
    const pairs = (data?.pairs || []).filter((p: any) => p.chainId === "solana");
    return pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
  } catch {
    return null;
  }
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
  } catch {
    return null;
  }
}

// ---- SCANNER ----
export async function runScanner(): Promise<void> {
  console.log("\n[Scanner] 🔍 Scan en cours...");
  const db = getPool();
  const tokens = await getDexScreenerTokens();
  let safe = 0, risky = 0;

  for (const token of tokens) {
    const addr = token.tokenAddress || token.address;
    if (!addr) continue;

    try {
      const [exists] = await db.query("SELECT id FROM scanned_tokens WHERE token_address=?", [addr]);
      if ((exists as any[]).length > 0) continue;

      const name = token.description || token.name || "Unknown";
      const pair = await getDexScreenerPairs(addr);
      const liquidity = pair?.liquidity?.usd || 0;

      if (liquidity < 1000) {
        await db.query(
          "INSERT IGNORE INTO scanned_tokens (token_address, token_name, status) VALUES (?, ?, 'RISKY')",
          [addr, name]
        );
        risky++;
        continue;
      }

      const rugcheck = await getRugCheckScore(addr);
      const score = rugcheck?.score ?? 50;
      const topHolder = rugcheck?.topHolder ?? 0;
      const isSafe = score >= 50 && topHolder < 40;
      const status = isSafe ? "SAFE" : "RISKY";

      await db.query(
        `INSERT INTO scanned_tokens (token_address, token_name, token_score, liquidity, top_holder_pct, status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE token_score=VALUES(token_score), status=VALUES(status)`,
        [addr, name, score, liquidity, topHolder, status]
      );

      if (isSafe) {
        console.log(`[Scanner] ✅ SAFE: ${name} (${score}/100)`);
        safe++;
      } else {
        risky++;
      }
    } catch (err) {
      console.error(`[Scanner] Erreur pour ${addr}:`, err);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[Scanner] Résultat: ${safe} SAFE | ${risky} RISKY`);
}

// ---- RUGGER DETECTOR ----
export async function runRuggerDetector(): Promise<void> {
  console.log("\n[Rugger] 🎯 Détection ruggers...");
  const db = getPool();

  const [riskyTokens] = await db.query(
    "SELECT token_address FROM scanned_tokens WHERE status='RISKY' ORDER BY scanned_at DESC LIMIT 10"
  );

  let walletCount = 0;

  for (const token of riskyTokens as any[]) {
    try {
      const res = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [token.token_address, { limit: 100 }],
        }),
      });
      const data = await res.json() as any;
      const txns = data?.result || [];
      const wallets = [...new Set(txns.map((t: any) => t.memo).filter(Boolean))].slice(0, 5) as string[];

      for (const wallet of wallets) {
        const [known] = await db.query("SELECT id FROM bundle_wallets WHERE wallet_address=?", [wallet]);
        if ((known as any[]).length > 0) continue;

        const wRes = await fetch(HELIUS_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getSignaturesForAddress",
            params: [wallet, { limit: 50 }],
          }),
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
          console.log(`[Rugger] ✅ Wallet: ${wallet.slice(0, 8)}... (${winRate.toFixed(1)}%)`);
          walletCount++;
        }
      }
    } catch (err) {
      console.error(`[Rugger] Erreur:`, err);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[Rugger] ${walletCount} nouveaux wallets détectés`);
}
