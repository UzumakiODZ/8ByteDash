import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import type { PortfolioResponse } from "@/lib/portfolio-types";
import { formatCompactINR, formatINR } from "@/lib/utils";
import { sectorColor } from "@/lib/sector-colors";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function shortSector(s: string): string {
  return s.replace(" Sector", "");
}

function renderInsideLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent == null || percent < 0.06) return null;
  const radians = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * radians);
  const y = cy + radius * Math.sin(-midAngle * radians);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function Charts({ data }: { data: PortfolioResponse }) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { theme } = useTheme();
  const dark = theme === "dark";

  const tickFill = dark ? "#a1a1aa" : "#71717a";
  const gridStroke = dark ? "#27272a" : "#e4e4e7";
  const barBlue = dark ? "#6aa5e8" : "#387ed1";
  const barGrey = dark ? "#52525b" : "#a1a1aa";
  const tooltipContentStyle = {
    fontSize: 12,
    borderRadius: 8,
    backgroundColor: dark ? "#18181b" : "#ffffff",
    borderColor: dark ? "#3f3f46" : "#d4d4d8",
    color: dark ? "#fafafa" : "#09090b",
  };

  const pieData = useMemo(
    () => data.sectors.map((s) => ({ name: s.sector, value: Math.round(s.totalPresentValue) })),
    [data]
  );
  const pieTotal = useMemo(() => pieData.reduce((s, d) => s + d.value, 0), [pieData]);

  const barData = useMemo(
    () =>
      data.sectors.map((s) => ({
        sector: isMobile ? shortSector(s.sector) : s.sector,
        Investment: Math.round(s.totalInvestment),
        PresentValue: Math.round(s.totalPresentValue),
      })),
    [data, isMobile]
  );

  return (
    <section id="analytics" className="charts" aria-label="Analytics">
      <article className="card">
        <header>
          <h3>Allocation by sector</h3>
          <p>Share of present value per sector</p>
        </header>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius="52%"
                outerRadius="88%"
                paddingAngle={2}
                label={renderInsideLabel}
                labelLine={false}
                stroke={dark ? "#09090b" : "#ffffff"}
                strokeWidth={2}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={sectorColor(d.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any) => [formatINR(Number(v)), "Present value"]}
                contentStyle={tooltipContentStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          {pieData.map((d) => (
            <span key={d.name} className="legend-item">
              <i style={{ backgroundColor: sectorColor(d.name) }} aria-hidden="true" />
              <span className="legend-name">{d.name}</span>
              <span className="legend-val">
                {pieTotal ? Math.round((d.value / pieTotal) * 100) : 0}%
              </span>
            </span>
          ))}
        </div>
      </article>

      <article className="card">
        <header>
          <h3>Sector performance</h3>
          <p>Investment vs present value per sector</p>
        </header>
        <div className="chart-body tall">
          <ResponsiveContainer width="100%" height="100%">
            {isMobile ? (
              <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="sector"
                  width={92}
                  tick={{ fontSize: 11, fill: tickFill }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: any) => formatINR(Number(v))}
                  contentStyle={tooltipContentStyle}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Investment" fill={barGrey} barSize={12} radius={[0, 4, 4, 0]} />
                <Bar dataKey="PresentValue" fill={barBlue} barSize={12} radius={[0, 4, 4, 0]} />
              </BarChart>
            ) : (
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="sector"
                  tick={{ fontSize: 11, fill: tickFill }}
                  interval={0}
                  angle={-18}
                  dy={10}
                  height={64}
                />
                <YAxis
                  width={52}
                  tick={{ fontSize: 11, fill: tickFill }}
                  tickFormatter={(v: number) => formatCompactINR(v)}
                />
                <Tooltip
                  formatter={(v: any) => formatINR(Number(v))}
                  contentStyle={tooltipContentStyle}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Investment" fill={barGrey} radius={[4, 4, 0, 0]} />
                <Bar dataKey="PresentValue" fill={barBlue} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
