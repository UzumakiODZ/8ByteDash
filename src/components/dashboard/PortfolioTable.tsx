import React, { memo, useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { formatINR, formatNumber, formatPct } from "@/lib/utils";
import { sectorColor } from "@/lib/sector-colors";
import type { EnrichedHolding, PortfolioResponse } from "@/lib/portfolio-types";

type SortKey =
  | "particulars"
  | "investment"
  | "cmp"
  | "presentValue"
  | "gainLoss"
  | "peRatio";

function GainCell({ value, pct }: { value: number | null; pct?: number | null }) {
  if (value === null || value === undefined) return <span className="text-light">—</span>;
  const pos = value >= 0;
  return (
    <span className={pos ? "pos" : "neg"}>
      {pos ? "▲ " : "▼ "}
      {formatINR(value)}
      {pct !== undefined && pct !== null && <small> ({formatPct(pct)})</small>}
    </span>
  );
}

function PortfolioTable({ data }: { data: PortfolioResponse }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("investment");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sectors = useMemo(() => ["All", ...data.sectors.map((s) => s.sector)], [data]);
  const sectorSummary = useMemo(() => new Map(data.sectors.map((s) => [s.sector, s])), [data]);
  const sectorCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of data.holdings) m.set(h.sector, (m.get(h.sector) ?? 0) + 1);
    return m;
  }, [data]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = data.holdings.filter(
      (h) =>
        (sector === "All" || h.sector === sector) &&
        (q === "" ||
          h.particulars.toLowerCase().includes(q) ||
          h.nseCode.toLowerCase().includes(q))
    );
    const bySector = new Map<string, EnrichedHolding[]>();
    for (const h of filtered) {
      const arr = bySector.get(h.sector) ?? [];
      arr.push(h);
      bySector.set(h.sector, arr);
    }
    const val = (h: EnrichedHolding): number => {
      switch (sortKey) {
        case "particulars":
          return 0;
        case "cmp":
          return h.cmp ?? -Infinity;
        case "presentValue":
          return h.presentValue ?? -Infinity;
        case "gainLoss":
          return h.gainLoss ?? -Infinity;
        case "peRatio":
          return h.peRatio ?? -Infinity;
        default:
          return h.investment;
      }
    };
    for (const arr of bySector.values()) {
      arr.sort((a, b) => {
        if (sortKey === "particulars") return sortDir * a.particulars.localeCompare(b.particulars);
        return sortDir * (val(a) - val(b));
      });
    }
    return [...bySector.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, query, sector, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === "particulars" ? 1 : -1);
    }
  };

  const sortBtn = (k: SortKey, label: string) => (
    <button type="button" className="sort-btn" onClick={() => toggleSort(k)} aria-label={`Sort by ${label}`}>
      {label} <ArrowUpDown size={12} />
    </button>
  );

  const shortName = (s: string) => (s === "All" ? "All" : s.replace(" Sector", ""));

  return (
    <section id="holdings" className="panel" aria-label="Holdings">
      <div className="panel-head">
        <div>
          <h2>
            Holdings <span className="badge">{data.holdings.length}</span>
          </h2>
          <p>
            LTP, current value &amp; P&amp;L refresh every 15s. Green is profit, red is loss. Grey
            figures are the sheet reference for comparison.
          </p>
        </div>
        <div className="panel-controls">
          <label className="searchbox">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search stock or NSE code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search holdings"
            />
          </label>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filter by sector">
        {sectors.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={sector === s}
            onClick={() => setSector(s)}
          >
            {s !== "All" && (
              <span
                className="chip-dot"
                style={{ backgroundColor: sectorColor(s) }}
                aria-hidden="true"
              />
            )}
            {shortName(s)}
            <span className="count">
              {s === "All" ? data.holdings.length : sectorCounts.get(s) ?? 0}
            </span>
          </button>
        ))}
      </div>

      <article className="card holdings-card" style={{ padding: 0, marginTop: "var(--space-3)" }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>{sortBtn("particulars", "Instrument")}</th>
                <th>NSE / BSE</th>
                <th className="num">Avg. cost</th>
                <th className="num">Qty.</th>
                <th className="num">{sortBtn("investment", "Invested")}</th>
                <th className="num">Wt %</th>
                <th className="num">{sortBtn("cmp", "LTP")}</th>
                <th className="num">{sortBtn("presentValue", "Current")}</th>
                <th className="num">{sortBtn("gainLoss", "P&L")}</th>
                <th className="num">{sortBtn("peRatio", "P/E")}</th>
                <th className="num">Earnings</th>
              </tr>
            </thead>
            {grouped.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={11} className="text-light">
                    No holdings match your filter.
                  </td>
                </tr>
              </tbody>
            )}
            {grouped.map(([sec, rows]) => {
              const sum = sectorSummary.get(sec);
              return (
                <tbody key={sec}>
                  <tr className="sector-row">
                    <td colSpan={11}>
                      <span
                        className="sector-dot"
                        style={{ backgroundColor: sectorColor(sec) }}
                        aria-hidden="true"
                      />
                      {sec} · {rows.length} stock{rows.length > 1 ? "s" : ""}
                      {sum && (
                        <span className="sector-meta">
                          Inv {formatINR(sum.totalInvestment)} · Cur{" "}
                          {formatINR(sum.totalPresentValue)} ·{" "}
                          <span className={sum.gainLoss >= 0 ? "pos" : "neg"}>
                            {formatINR(sum.gainLoss)} ({formatPct(sum.gainLossPct)})
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                  {rows.map((h) => (
                    <tr key={h.yahooSymbol}>
                      <td>
                        <span className="instrument">{h.particulars}</span>{" "}
                        {h.cmpSource === "sheet" && (
                          <span className="badge outline" title="Live price unavailable — sheet reference value">
                            sheet
                          </span>
                        )}
                        {h.cmpSource === "mock" && (
                          <span className="badge outline" title={h.quoteError ?? "offline fallback"}>
                            cached
                          </span>
                        )}
                      </td>
                      <td className="exchange">
                        {h.nseCode ? `${h.nseCode} / ${h.bseCode}` : `BSE ${h.bseCode}`}
                      </td>
                      <td className="num">{formatINR(h.purchasePrice)}</td>
                      <td className="num">{h.qty}</td>
                      <td className="num">{formatINR(h.investment)}</td>
                      <td className="num">{formatNumber(h.portfolioPct)}%</td>
                      <td className="num">
                        {h.cmpSource === "live" && (
                          <span className="live-dot" aria-label="Live price" title="Live price" />
                        )}
                        {h.cmp !== null ? formatINR(h.cmp) : "—"}
                        {h.cmpSource === "live" && h.sheetCmp !== null && (
                          <span className="sheet-ref">sheet {formatINR(h.sheetCmp)}</span>
                        )}
                      </td>
                      <td className="num">
                        {h.presentValue !== null ? formatINR(h.presentValue) : "—"}
                      </td>
                      <td className="num">
                        <GainCell value={h.gainLoss} pct={h.gainLossPct} />
                      </td>
                      <td className="num">
                        {h.peRatio !== null ? formatNumber(h.peRatio) : "—"}
                        {h.peSource === "sheet" && h.peRatio !== null && (
                          <span className="sheet-ref">sheet</span>
                        )}
                      </td>
                      <td className="num">
                        {h.latestEarnings !== null ? (
                          <>
                            ₹{formatNumber(h.latestEarnings)}
                            <span className="sheet-ref">
                              {h.earningsSource === "live" ? h.earningsLabel : "Sheet (TTM)"}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      </article>
    </section>
  );
}

export default memo(PortfolioTable);
