export interface Holding {
  particulars: string;
  nseCode: string;
  bseCode: string;
  yahooSymbol: string;
  purchasePrice: number;
  qty: number;
  sector: string;
  sheetCmp: number | null;
  sheetPe: number | null;
  sheetEarnings: number | null;
}

export interface Quote {
  symbol: string;
  cmp: number | null;
  peRatio: number | null;
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

export interface SoldHolding {
  particulars: string;
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
  indices: IndexQuote[];
  totals: {
    totalInvestment: number;
    totalPresentValue: number;
    totalGainLoss: number;
    totalGainLossPct: number;
  };
  lastUpdated: string;
  partial: boolean;
  errors: string[];
  meta: {
    source: string;
    disclaimer: string;
    cacheTtlSec: number;
    refreshIntervalSec: number;
  };
}
