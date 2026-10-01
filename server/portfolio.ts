import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type {
  EnrichedHolding,
  Holding,
  PortfolioResponse,
  SectorSummary,
  SoldHolding,
} from "../src/lib/portfolio-types.js";
import { CACHE_TTL_MS, getIndices, getQuotes } from "./yahoo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const holdingsPath = path.join(__dirname, "data", "holdings.json");
const soldPath = path.join(__dirname, "data", "sold.json");

interface SoldRow {
  particulars: string;
  nseCode: string;
  bseCode: string;
  purchasePrice: number;
  qty: number;
  salePrice: number;
  note: string | null;
}

function loadHoldings(): Holding[] {
  const raw = readFileSync(holdingsPath, "utf-8");
  return JSON.parse(raw) as Holding[];
}

function loadSold(): SoldHolding[] {
  try {
    const rows = JSON.parse(readFileSync(soldPath, "utf-8")) as SoldRow[];
    return rows.map((r) => {
      const investment = r.purchasePrice * r.qty;
      const proceeds = r.salePrice * r.qty;
      const realizedGain = proceeds - investment;
      return {
        ...r,
        investment,
        proceeds,
        realizedGain,
        realizedGainPct: investment !== 0 ? (realizedGain / investment) * 100 : 0,
      };
    });
  } catch {
    return [];
  }
}

export async function buildPortfolio(): Promise<PortfolioResponse> {
  const holdings = loadHoldings();
  const sold = loadSold();
  const [{ quotes, partial }, indices] = await Promise.all([
    getQuotes(holdings.map((h) => h.yahooSymbol)),
    getIndices(),
  ]);
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const errors: string[] = [];

  const totalInvestment = holdings.reduce((s, h) => s + h.purchasePrice * h.qty, 0);

  const enriched: EnrichedHolding[] = holdings.map((h) => {
    const q = bySymbol.get(h.yahooSymbol);
    const investment = h.purchasePrice * h.qty;

    // CMP fallback chain: live Yahoo → excel sheet reference → unavailable.
    // (The old mock fallback in yahoo.ts only triggers when no sheet value exists;
    // every sheet holding has one, so sheet values win over mocks.)
    let cmp: number | null = null;
    let cmpSource: EnrichedHolding["cmpSource"] = "unavailable";
    if (q && !q.stale && q.cmp !== null) {
      cmp = q.cmp;
      cmpSource = "live";
    } else if (h.sheetCmp !== null) {
      cmp = h.sheetCmp;
      cmpSource = "sheet";
    } else if (q?.cmp !== null && q?.cmp !== undefined) {
      cmp = q!.cmp;
      cmpSource = "mock";
    }

    const presentValue = cmp !== null ? cmp * h.qty : null;
    const gainLoss = presentValue !== null ? presentValue - investment : null;
    const gainLossPct = gainLoss !== null && investment !== 0 ? (gainLoss / investment) * 100 : null;

    // P/E + earnings fallback chain: live Yahoo → excel sheet → unavailable.
    const peLive = q && !q.stale ? q.peRatio : null;
    const earnLive = q && !q.stale ? q.latestEarnings : null;

    if (q?.stale && q.error && q.error !== "offline-fallback")
      errors.push(`${h.yahooSymbol}: stale (${q.error})`);

    return {
      ...h,
      investment,
      portfolioPct: totalInvestment !== 0 ? (investment / totalInvestment) * 100 : 0,
      cmp,
      cmpSource,
      presentValue,
      gainLoss,
      gainLossPct,
      peRatio: peLive ?? h.sheetPe,
      peSource: peLive !== null ? "live" : h.sheetPe !== null ? "sheet" : "unavailable",
      latestEarnings: earnLive ?? h.sheetEarnings,
      earningsSource: earnLive !== null ? "live" : h.sheetEarnings !== null ? "sheet" : "unavailable",
      earningsLabel:
        q && !q.stale && q.earningsLabel ? q.earningsLabel : "As per sheet (TTM)",
      quoteStale: cmpSource !== "live",
      quoteError: cmpSource === "live" ? undefined : q?.error,
    };
  });

  // Sector grouping
  const sectorMap = new Map<string, EnrichedHolding[]>();
  for (const h of enriched) {
    const arr = sectorMap.get(h.sector) ?? [];
    arr.push(h);
    sectorMap.set(h.sector, arr);
  }

  const sectors: SectorSummary[] = [...sectorMap.entries()].map(([sector, stocks]) => {
    const totalInv = stocks.reduce((s, x) => s + x.investment, 0);
    const totalPv = stocks.reduce((s, x) => s + (x.presentValue ?? 0), 0);
    const gl = totalPv - totalInv;
    return {
      sector,
      stockCount: stocks.length,
      totalInvestment: totalInv,
      totalPresentValue: totalPv,
      gainLoss: gl,
      gainLossPct: totalInv !== 0 ? (gl / totalInv) * 100 : 0,
      weightPct: totalInvestment !== 0 ? (totalInv / totalInvestment) * 100 : 0,
    };
  });
  sectors.sort((a, b) => b.totalInvestment - a.totalInvestment);

  const totalPresentValue = enriched.reduce((s, x) => s + (x.presentValue ?? 0), 0);
  const totalGainLoss = totalPresentValue - totalInvestment;
  const anyFallback = enriched.some((h) => h.cmpSource !== "live");

  return {
    holdings: enriched,
    sectors,
    sold,
    indices,
    totals: {
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPct: totalInvestment !== 0 ? (totalGainLoss / totalInvestment) * 100 : 0,
    },
    lastUpdated: new Date().toISOString(),
    partial: partial || anyFallback,
    errors,
    meta: {
      source:
        "Yahoo Finance (unofficial yahoo-finance2) via Node.js proxy — CMP, trailing P/E & EPS stand in for Yahoo CMP + Google Finance P/E/earnings; excel sheet values used as reference + fallback",
      disclaimer:
        "Holdings, purchase prices, quantities, sectors and reference P/E/earnings are transcribed from the client's excel sheet (F9001561_ADDBA737E8_B72562937A.xlsx). Live CMP/P-E/EPS come from unofficial Yahoo endpoints and may be delayed/inaccurate; rows flagged 'sheet' show the excel reference value because live data was unavailable. P/E = trailing P/E, Latest Earnings = TTM EPS. For production, verify against broker data.",
      cacheTtlSec: Math.round(CACHE_TTL_MS / 1000),
      refreshIntervalSec: 15,
    },
  };
}
