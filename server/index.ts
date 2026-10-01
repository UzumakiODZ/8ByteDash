import express from "express";
import cors from "cors";
import path from "node:path";
import { buildPortfolio } from "./portfolio.js";
import { getCacheStats, getQuotes } from "./yahoo.js";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), cache: getCacheStats() });
});

app.get("/api/portfolio", async (_req, res) => {
  try {
    const data = await buildPortfolio();
    res.setHeader("Cache-Control", "public, max-age=10");
    res.json(data);
  } catch (err: any) {
    console.error("portfolio error", err);
    res.status(502).json({ error: "Failed to build portfolio", detail: String(err?.message ?? err) });
  }
});

app.get("/api/quotes", async (req, res) => {
  try {
    const symbols = String(req.query.symbols ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 25);
    if (symbols.length === 0) {
      res.status(400).json({ error: "Provide ?symbols=HDFCBANK.NS,INFY.NS" });
      return;
    }
    const { quotes, partial } = await getQuotes(symbols);
    res.json({ quotes, partial, lastUpdated: new Date().toISOString() });
  } catch (err: any) {
    res.status(502).json({ error: "Quote fetch failed", detail: String(err?.message ?? err) });
  }
});

// In production, serve the Vite build from the same service as the API so the
// dashboard can keep using relative /api requests without a separate CORS setup.
const clientBuild = path.resolve(process.cwd(), "dist");
app.use(express.static(clientBuild));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientBuild, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[8ByteDash] API listening on http://localhost:${PORT}`);
});
