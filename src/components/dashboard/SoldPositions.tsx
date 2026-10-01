import React, { memo } from "react";
import { formatINR, formatPct } from "@/lib/utils";
import type { SoldHolding } from "@/lib/portfolio-types";

function SoldPositions({ sold }: { sold: SoldHolding[] }) {
  if (sold.length === 0) return null;
  return (
    <section id="exited" className="panel" aria-label="Exited positions">
      <div className="panel-head">
        <div>
          <h2>Exited positions</h2>
          <p>Closed positions from the sheet — excluded from live totals.</p>
        </div>
      </div>
      <article className="card" style={{ padding: 0 }}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>NSE / BSE</th>
                <th className="num">Buy</th>
                <th className="num">Qty.</th>
                <th className="num">Invested</th>
                <th className="num">Sale</th>
                <th className="num">Proceeds</th>
                <th className="num">Realised P&amp;L</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {sold.map((s) => {
                const pos = s.realizedGain >= 0;
                return (
                  <tr key={s.bseCode}>
                    <td>
                      <span className="instrument">{s.particulars}</span>
                    </td>
                    <td className="exchange">
                      {s.nseCode} / {s.bseCode}
                    </td>
                    <td className="num">{formatINR(s.purchasePrice)}</td>
                    <td className="num">{s.qty}</td>
                    <td className="num">{formatINR(s.investment)}</td>
                    <td className="num">{formatINR(s.salePrice)}</td>
                    <td className="num">{formatINR(s.proceeds)}</td>
                    <td className="num">
                      <span className={pos ? "pos" : "neg"}>
                        {pos ? "+" : ""}
                        {formatINR(s.realizedGain)} <small>({formatPct(s.realizedGainPct)})</small>
                      </span>
                    </td>
                    <td>{s.note ? <span className="badge outline">{s.note}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default memo(SoldPositions);
