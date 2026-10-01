import React from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import StatsStrip from "@/components/dashboard/StatsStrip";
import Charts from "@/components/dashboard/Charts";
import PortfolioTable from "@/components/dashboard/PortfolioTable";
import SoldPositions from "@/components/dashboard/SoldPositions";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AlertCircle, RotateCw, WifiOff } from "lucide-react";

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

      <main className="kite-wrap">
        {error && !data && (
          <div className="feedback-card" role="alert" data-variant="error">
            <AlertCircle aria-hidden="true" size={20} />
            <div>
              <strong>Could not load portfolio</strong>
              <p>{error}. Check that the API server is running on :5000, then try again.</p>
              <button type="button" className="outline small" onClick={refresh}>
                <RotateCw size={14} /> Try again
              </button>
            </div>
          </div>
        )}

        {loading && !data ? (
          <div className="loading-grid" aria-label="Loading portfolio">
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
              <section className="dashboard-intro" aria-labelledby="dashboard-title">
                <div>
                  <p className="eyebrow">Portfolio overview</p>
                  <h1 id="dashboard-title">A clearer view of your investments.</h1>
                  <p>Live market values, sector allocation, and performance in one place.</p>
                </div>
                <div className={`data-status ${data.partial ? "is-cached" : ""}`}>
                  <span aria-hidden="true" />
                  {data.partial ? "Some values are cached" : "Live market data"}
                </div>
              </section>
              {data.partial && (
                <div className="feedback-card" role="alert" data-variant="warning">
                  <WifiOff aria-hidden="true" size={20} />
                  <div>
                    <strong>Live prices are partially unavailable</strong>
                    <p>
                      Some rows use sheet reference values until market data is available again.
                      {data.errors.length > 0 && ` ${data.errors.slice(0, 3).join(" · ")}`}
                    </p>
                  </div>
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
      </main>
    </>
  );
}
