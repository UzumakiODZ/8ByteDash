import React, { memo } from "react";
import { formatINR, formatPct } from "@/lib/utils";
import type { PortfolioResponse } from "@/lib/portfolio-types";

/** Kite-style summary strip: plain label + large figure, no cards. */
function StatsStrip({ data }: { data: PortfolioResponse }) {
  const { totals } = data;
  const gain = totals.totalGainLoss >= 0;

  return (
    <section aria-label="Portfolio summary">
      <div className="stats">
        <div>
          <p className="stat-label">Total investment</p>
          <p className="stat-value">{formatINR(totals.totalInvestment)}</p>
          <p className="stat-sub">
            {data.holdings.length} holdings · {data.sectors.length} sectors
          </p>
        </div>
        <div>
          <p className="stat-label">Current value</p>
          <p className="stat-value">{formatINR(totals.totalPresentValue)}</p>
          <p className="stat-sub">{data.partial ? "Includes sheet reference prices" : "Live prices"}</p>
        </div>
        <div>
          <p className="stat-label">Total P&amp;L</p>
          <p className={`stat-value ${gain ? "pos" : "neg"}`}>
            {gain ? "▲ " : "▼ "}
            {formatINR(totals.totalGainLoss)}
          </p>
          <p className="stat-sub">Current value − investment</p>
        </div>
        <div>
          <p className="stat-label">Overall return</p>
          <p className={`stat-value ${gain ? "pos" : "neg"}`}>
            {formatPct(totals.totalGainLossPct)}
          </p>
          <p className="stat-sub">Weighted across portfolio</p>
        </div>
      </div>
    </section>
  );
}

export default memo(StatsStrip);
