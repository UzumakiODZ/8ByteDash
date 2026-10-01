import yahooFinance from "yahoo-finance2";
import type { IndexQuote, Quote } from "../src/lib/portfolio-types.js";

// yahoo-finance2 v2 default-export is a pre-built instance (not a constructor).
const yahoo: any = yahooFinance as any;
try {
  yahoo.suppressNotices(["yahooSurvey"]);
} catch {
  /* older versions may not expose suppressNotices — safe to ignore */
}

// ---------------------------------------------------------------------------
// Simple in-memory cache with TTL + request coalescing + throttle.
// Yahoo has no official public API; yahoo-finance2 hits the unofficial
// chart/quote endpoints. To respect rate limits we:
//   1. cache quotes for CACHE_TTL_MS
//   2. coalesce concurrent requests for the same symbol
//   3. throttle batches (small delay between symbols)
//   4. fall back to last-known-good values, then to deterministic mock data
// ---------------------------------------------------------------------------

export const CACHE_TTL_MS = 15_000;

interface CacheEntry {
  quote: Quote;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Quote>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Deterministic mock CMP so the UI never goes blank (clearly flagged stale). */
function mockQuote(symbol: string): Quote {
  let h = 0;
  for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 100000;
  const cmp = 500 + (h % 9000) + (h % 100) / 100;
  return {
    symbol,
    cmp: Math.round(cmp * 100) / 100,
    peRatio: 18 + ((h % 200) / 10),
    latestEarnings: Math.round(((cmp / 22) * 100)) / 100,
    earningsLabel: "Mock TTM EPS (offline fallback)",
    currency: "INR",
    marketState: "UNKNOWN",
    previousClose: null,
    dayHigh: null,
    dayLow: null,
    stale: true,
    error: "offline-fallback",
  };
}

async function fetchOne(symbol: string): Promise<Quote> {
  const now = Date.now();
  const cached = cache.get(symbol);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached.quote, stale: false };
  }
  const ongoing = inflight.get(symbol);
  if (ongoing) return ongoing;

  const p = (async (): Promise<Quote> => {
    try {
      const q: any = await yahoo.quote(symbol);
      const cmp =
        typeof q.regularMarketPrice === "number"
          ? q.regularMarketPrice
          : typeof q.ask === "number"
            ? q.ask
            : typeof q.bid === "number"
              ? q.bid
              : null;
      const quote: Quote = {
        symbol,
        cmp,
        peRatio:
          typeof q.trailingPE === "number"
            ? q.trailingPE
            : typeof q.forwardPE === "number"
              ? q.forwardPE
              : null,
        latestEarnings:
          typeof q.trailingEps === "number"
            ? q.trailingEps
            : typeof q.forwardEps === "number"
              ? q.forwardEps
              : null,
        earningsLabel:
          typeof q.trailingEps === "number"
            ? "TTM EPS"
            : typeof q.forwardEps === "number"
              ? "Forward EPS"
              : null,
        currency: q.currency ?? "INR",
        marketState: q.marketState ?? null,
        previousClose:
          typeof q.regularMarketPreviousClose === "number"
            ? q.regularMarketPreviousClose
            : null,
        dayHigh: typeof q.regularMarketDayHigh === "number" ? q.regularMarketDayHigh : null,
        dayLow: typeof q.regularMarketDayLow === "number" ? q.regularMarketDayLow : null,
        stale: false,
      };
      if (cmp === null) {
        // Yahoo returned no price — reuse cache if possible.
        if (cached) return { ...cached.quote, stale: true, error: "no-price" };
        return mockQuote(symbol);
      }
      cache.set(symbol, { quote, fetchedAt: Date.now() });
      return quote;
    } catch (err: any) {
      if (cached) return { ...cached.quote, stale: true, error: String(err?.message ?? err) };
      const m = mockQuote(symbol);
      m.error = String(err?.message ?? err);
      // Cache the mock briefly so we don't hammer Yahoo while offline.
      cache.set(symbol, { quote: m, fetchedAt: Date.now() - CACHE_TTL_MS + 5_000 });
      return m;
    } finally {
      inflight.delete(symbol);
    }
  })();

  inflight.set(symbol, p);
  return p;
}

export async function getQuotes(symbols: string[]): Promise<{ quotes: Quote[]; partial: boolean }> {
  const unique = [...new Set(symbols)];
  const quotes: Quote[] = [];
  let partial = false;
  for (let i = 0; i < unique.length; i++) {
    const q = await fetchOne(unique[i]);
    if (q.stale) partial = true;
    quotes.push(q);
    // Gentle throttle between symbols to avoid Yahoo rate-limiting.
    if (i < unique.length - 1) await sleep(120);
  }
  return { quotes, partial };
}

export function getCacheStats() {
  return { size: cache.size, ttlMs: CACHE_TTL_MS };
}

// ---------------------------------------------------------------------------
// Market indices for the Kite-style ticker strip. Best-effort: never throws,
// never affects the holdings `partial` flag.
// ---------------------------------------------------------------------------

const INDICES: Array<{ symbol: string; label: string }> = [
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "^BSESN", label: "SENSEX" },
  { symbol: "^NSEBANK", label: "NIFTY BANK" },
];

export async function getIndices(): Promise<IndexQuote[]> {
  const out: IndexQuote[] = [];
  for (const { symbol, label } of INDICES) {
    try {
      const q: any = await yahoo.quote(symbol);
      out.push({
        symbol,
        label,
        price: typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : null,
        change: typeof q.regularMarketChange === "number" ? q.regularMarketChange : null,
        changePct:
          typeof q.regularMarketChangePercent === "number" ? q.regularMarketChangePercent : null,
      });
    } catch {
      out.push({ symbol, label, price: null, change: null, changePct: null });
    }
    await sleep(120);
  }
  return out.filter((i) => i.price !== null);
}
