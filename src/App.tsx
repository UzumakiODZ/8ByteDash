import React from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import StatsStrip from "@/components/dashboard/StatsStrip";
import Charts from "@/components/dashboard/Charts";
import PortfolioTable from "@/components/dashboard/PortfolioTable";
import SoldPositions from "@/components/dashboard/SoldPositions";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

function Dashboard() {
  const { data, loading, error, countdown, paused, lastUpdated, refresh, togglePaused } =
    usePortfolio();

  return (
    <>
      <HeaderBar
        countdown={countdown}
        paused={paused}
        loading={loading}
        lastUpdated={lastUpdated}
        partial={data?.partial ?? false}
        indices={data?.indices ?? []}
        onToggle={togglePaused}
        onRefresh={refresh}
      />

      <div className="kite-wrap">
        {error && !data && (
          <div role="alert" data-variant="error" style={{ marginTop: "var(--space-4)" }}>
            <strong>Could not load portfolio.</strong> {error}. Is the API server running on
            :5000? Start it with <code>npm run dev:server</code> (or <code>npm run dev</code>{" "}
            for both).
          </div>
        )}

        {loading && !data ? (
          <div className="loading-grid" aria-label="Loading">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                role="status"
                className="skeleton box"
                style={{ height: 96 }}
                aria-label="Loading"
              />
            ))}
          </div>
        ) : (
          data && (
            <>
              {data.partial && (
                <div role="alert" data-variant="warning" style={{ marginTop: "var(--space-4)" }}>
                  <strong>Note:</strong> some rows show excel sheet reference values because live
                  prices were unavailable (rate-limit or market closed).
                  {data.errors.length > 0 && ` ${data.errors.slice(0, 3).join(" · ")}`}
                </div>
              )}
              <StatsStrip data={data} />
              <Charts data={data} />
              <PortfolioTable data={data} />
              <SoldPositions sold={data.sold} />
              <footer className="fineprint">
                <strong>Data disclaimer:</strong> {data.meta.disclaimer} Source —{" "}
                {data.meta.source}. Cache TTL {data.meta.cacheTtlSec}s · refresh{" "}
                {data.meta.refreshIntervalSec}s. UI built with{" "}
                <a href="https://oat.ink">Oat UI</a> (Zerodha CTO&apos;s zero-dependency component
                library), styled after Kite.
              </footer>
            </>
          )
        )}
      </div>
    </>
  );
}
