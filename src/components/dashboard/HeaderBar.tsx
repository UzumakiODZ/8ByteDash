import React from "react";
import { Pause, Play, RefreshCw, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { formatNumber, formatPct } from "@/lib/utils";
import type { IndexQuote } from "@/lib/portfolio-types";

interface Props {
  countdown: number;
  paused: boolean;
  loading: boolean;
  lastUpdated: string | null;
  partial: boolean;
  indices: IndexQuote[];
  onToggle: () => void;
  onRefresh: () => void;
}

export function HeaderBar({
  countdown,
  paused,
  loading,
  lastUpdated,
  partial,
  indices,
  onToggle,
  onRefresh,
}: Props) {
  const { theme, toggle } = useTheme();

  return (
    <>
      {indices.length > 0 && (
        <div className="ticker" aria-label="Market indices">
          <div className="ticker-inner">
            {indices.map((ix) => {
              const up = (ix.changePct ?? 0) >= 0;
              return (
                <span
                  key={ix.symbol}
                  className="ticker-item"
                  title={ix.change !== null ? `Net change ${formatNumber(ix.change)}` : undefined}
                >
                  {ix.label}
                  <strong>{ix.price !== null ? formatNumber(ix.price) : "—"}</strong>
                  <span className={`chg ${up ? "pos" : "neg"}`}>{formatPct(ix.changePct)}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <header className="kite-header">
        <div className="kite-header-inner">
          <a className="brand" href="#" aria-label="8ByteDash home">
            <span className="brand-mark" aria-hidden="true">
              8
            </span>
            <span className="brand-name">
              8ByteDash<small>Portfolio dashboard</small>
            </span>
          </a>

          <nav className="kite-nav" aria-label="Primary">
            <a href="#holdings" aria-current="page">
              Holdings
            </a>
            <a href="#analytics">Analytics</a>
            <a href="#exited">Exited</a>
          </nav>

          <div className="kite-actions">
            <span className="kite-updated">
              {lastUpdated
                ? `Updated ${new Date(lastUpdated).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}${!paused && !loading ? ` · refresh in ${countdown}s` : paused ? " · paused" : ""}`
                : "Connecting…"}
              {partial ? " · cached" : ""}
            </span>
            <button
              type="button"
              className="outline small"
              onClick={toggle}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button type="button" className="outline small" onClick={onToggle}>
              {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? "Resume" : "Pause"}
            </button>
            <button type="button" className="small" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
