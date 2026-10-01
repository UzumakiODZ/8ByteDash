# 8ByteDash — Dynamic Portfolio Dashboard (React + Vite + Node.js + Oat UI)

Live NSE portfolio dashboard styled after **Zerodha Kite**, built with **React (Vite) +
TypeScript** frontend on **[Oat UI](https://oat.ink)** (Zerodha CTO's zero-dependency,
semantic-HTML component library, `@knadh/oat`) and a **Node.js + Express** backend that
proxies Yahoo Finance (unofficial API). No Tailwind, no shadcn — just Oat's ~10KB of CSS
plus a small Kite theme layer (`src/styles/kite.css`: Zerodha blue `#387ed1`, Kite-style
header/indices strip/stat strip/dense tables, green/red P&amp;L).

## Features (all INSTRUCTIONS.md requirements)

| Requirement | Implementation |
|---|---|
| Portfolio table: Particulars, Purchase Price, Qty, Investment, Portfolio %, NSE/BSE, CMP, Present Value, Gain/Loss, P/E, Latest Earnings | `src/components/dashboard/PortfolioTable.tsx` — all 11 columns |
| CMP from Yahoo Finance | `server/yahoo.ts` via `yahoo-finance2` `quote()` |
| P/E + Latest Earnings ("Google Finance") | Trailing P/E + TTM/Forward EPS from the same Yahoo quote (no official Google API exists — documented in footer + `TECHNICAL.md`) |
| Auto-refresh CMP / PV / G/L every 15s | `src/hooks/usePortfolio.ts` (`setInterval` 15s + 1s countdown + pause/resume) |
| Sheet reference display | Live CMP/P-E/earnings with grey sheet sub-text; `sheet` badge when live is unavailable; sold table |
| Green/red gain-loss | Tailwind `text-green-600` / `text-red-600` in table, cards, sector badges |
| Sector grouping + summaries | Group-by-sector tables + `SectorSummary` (investment / PV / G/L) + pie + bar charts (recharts) |
| shadcn + Tailwind UI | Oat UI semantic components (`button`, `.card`, `.table`, `.badge`, `role="alert"`, `.skeleton`) + `src/styles/kite.css` Kite theme |
| Market indices strip | NIFTY 50 / SENSEX / NIFTY BANK via Yahoo (`^NSEI`, `^BSESN`, `^NSEBANK`), best-effort |
| Caching / throttling / batching | 15s in-memory cache, request coalescing, 120ms inter-symbol throttle, `Cache-Control: max-age=10` |
| Error handling | Graceful stale-cache → mock fallback, `partial` flag, error banner, per-row `cached` badge |
| Responsive | Tailwind grid, horizontal-scroll tables, mobile header stack |

## Project structure

```
├── index.html                  # Vite entry (+ pre-paint theme script)
├── src/
│   ├── main.tsx / App.tsx      # entry, ThemeProvider + dashboard layout
│   ├── styles/kite.css         # Kite theme layer over Oat design tokens
│   ├── lib/utils.ts            # INR formatters
│   ├── lib/portfolio-types.ts  # shared types (client + server)
│   ├── hooks/usePortfolio.ts   # 15s polling hook
│   └── components/
│       ├── ThemeProvider.tsx   # light/dark via Oat `color-scheme` + localStorage
│       └── dashboard/          # HeaderBar, StatsStrip, Charts, PortfolioTable, SoldPositions
├── server/
│   ├── index.ts                # Express API (:5000)
│   ├── yahoo.ts                # Yahoo proxy + cache + fallback
│   ├── portfolio.ts            # enrichment: investment, PV, G/L, sectors
│   └── data/holdings.json      # 12-stock portfolio (stand-in for the excel sheet)
├── vite.config.ts              # /api → :5000 proxy
└── TECHNICAL.md                # challenge/solution write-up
```

> **Client excel sheet:** all holdings data is transcribed from `F9001561_ADDBA737E8_B72562937A.xlsx`
> (sheet `Priyanshu`) into `server/data/holdings.json` — 26 live holdings across 6 sheet sectors
> (Financial Sector, Tech Sector, Consumer, Power, Pipe Sector, Others) with the sheet's
> purchase prices, quantities, NSE/BSE codes, CMP, P/E (TTM) and Latest Earnings kept as
> `sheetCmp` / `sheetPe` / `sheetEarnings` reference values. Investment total (₹15,43,060)
> matches the sheet exactly. The 3 closed rows (Infosys, Happiest Minds, EaseMyTrip) live in
> `server/data/sold.json` and render in a separate "Exited / sold positions" table, excluded
> from live totals. NSE/BSE codes were mapped to Yahoo symbols (BSE-only Savani Financials
> → `511577.BO`; see TECHNICAL.md for the full map).

## Prerequisites

- Node.js 18+ and npm

## Setup & run

```bash
npm install

# Terminal A + B, or single command below:
npm run dev:server    # Express API  → http://localhost:5000
npm run dev:client    # Vite client  → http://localhost:5173

# …or both together:
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to `:5000`.

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Liveness + cache stats |
| `GET /api/portfolio` | Full enriched holdings + sector summaries + totals |
| `GET /api/quotes?symbols=HDFCBANK.NS,INFY.NS` | Raw quotes (max 25 symbols, debugging) |

## Production build

```bash
npm run build            # tsc + vite build → dist/
npm run build:server     # tsc → dist-server/
PORT=5000 npm run start:server
```

Serve `dist/` with any static host and point `/api` at the Express server.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | client + server concurrently |
| `npm run dev:client` / `dev:server` | run individually |
| `npm run build` / `build:server` | build client / server |
| `npm run typecheck` | `tsc --noEmit` |
