// Shared portfolio data-model types (used by both client + server).

export interface Holding {
  /** Human readable stock name, e.g. "HDFC Bank" */
  particulars: string;
  /** NSE symbol code, e.g. "HDFCBANK" ("" when BSE-only listing) */
  nseCode: string;
  /** BSE scrip code, e.g. "500180" */
  bseCode: string;
  /** Yahoo Finance symbol, e.g. "HDFCBANK.NS" (".BO" suffix for BSE-only) */
  yahooSymbol: string;
  purchasePrice: number;
  qty: number;
  sector: string;
  /** Static reference values transcribed from the client's excel sheet. */
  sheetCmp: number | null;
  sheetPe: number | null;
  sheetEarnings: number | null;
}

export interface Quote {
  symbol: string;
  /** Current Market Price (live) */
  cmp: number | null;
  /** Trailing P/E ratio — stands in for "Google Finance P/E" */
  peRatio: number | null;
  /** Trailing EPS (INR) — stands in for "Latest Earnings" per-share basis */
  latestEarnings: number | null;
  earningsLabel: string | null;
  currency: string | null;
  marketState: string | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  stale: boolean;
  error?: string;
}

export interface EnrichedHolding extends Holding {
  investment: number;
  portfolioPct: number;
  cmp: number | null;
  /** Where the displayed CMP came from: live Yahoo, excel sheet, or mock fallback */
  cmpSource: "live" | "sheet" | "mock" | "unavailable";
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPct: number | null;
  peRatio: number | null;
  peSource: "live" | "sheet" | "unavailable";
  latestEarnings: number | null;
  earningsSource: "live" | "sheet" | "unavailable";
  earningsLabel: string | null;
  quoteStale: boolean;
  quoteError?: string;
}

export interface IndexQuote {
  symbol: string;
  label: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
}

export interface SoldHolding {  particulars: string;
  nseCode: string;
  bseCode: string;
  purchasePrice: number;
  qty: number;
  investment: number;
  salePrice: number;
  proceeds: number;
  realizedGain: number;
  realizedGainPct: number;
  note: string | null;
}

export interface SectorSummary {
  sector: string;
  stockCount: number;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  gainLossPct: number;
  weightPct: number;
}

export interface PortfolioResponse {
  holdings: EnrichedHolding[];
  sectors: SectorSummary[];
  sold: SoldHolding[];
  /** Market index snapshot for the Kite-style ticker strip (best-effort). */
  indices: IndexQuote[];
  totals: {
    totalInvestment: number;
    totalPresentValue: number;
    totalGainLoss: number;
    totalGainLossPct: number;
  };
  lastUpdated: string;
  /** true when ANY quote fell back to cache/mock */
  partial: boolean;
  errors: string[];
  meta: {
    source: string;
    disclaimer: string;
    cacheTtlSec: number;
    refreshIntervalSec: number;
  };
}
