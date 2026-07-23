import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { useChartColors, CHART_PALETTE, buildTooltipStyle } from '../../hooks/useChartColors';
import { formatCompact, prettifyMetricName, truncateLabel } from '../../utils/chartUtils';
import type { ComparisonOutput, ComparisonRow, RiskSummary } from '../../services/api/comparison';

// ── Chart data builders ──────────────────────────────────────────

const KEY_METRICS_FOR_COMPARISON = [
  'revenue', 'net_income', 'gross_profit', 'ebitda', 'operating_income',
  'total_assets', 'total_equity', 'total_debt',
  'operating_cash_flow', 'free_cash_flow',
];

const KEY_MARGINS_FOR_RADAR = [
  'gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin',
  'roe', 'roa', 'current_ratio',
];

function buildGroupedBarData(comparison: ComparisonRow[], companies: string[]) {
  // Pick the first N key metrics that exist in the comparison rows
  const rows = comparison.filter((r) => KEY_METRICS_FOR_COMPARISON.includes(r.metric_key));
  const usedRows = rows.slice(0, 8);

  return usedRows.map((row) => {
    const point: Record<string, string | number | null> = {
      metric: prettifyMetricName(row.metric_name || row.metric_key),
    };
    for (const company of companies) {
      const cell = row.companies[company];
      point[company] = cell?.value ?? null;
    }
    return point;
  });
}

function buildRadarData(comparison: ComparisonRow[], companies: string[]) {
  const rows = comparison.filter((r) => KEY_MARGINS_FOR_RADAR.includes(r.metric_key));

  return rows.map((row) => {
    const point: Record<string, string | number | null> = {
      subject: prettifyMetricName(row.metric_name || row.metric_key),
    };
    for (const company of companies) {
      const cell = row.companies[company];
      point[company] = cell?.value ?? null;
    }
    return point;
  });
}

function buildRiskScoreData(riskSummary: RiskSummary[]) {
  return riskSummary.map((r) => ({
    name: r.company_name,
    score: r.risk_score,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    ...r.severities.reduce((acc, severity) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }));
}

function buildRiskDistribution(riskSummary: RiskSummary[]) {
  return riskSummary.map((r) => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const s of r.severities) {
      counts[s] = (counts[s] || 0) + 1;
    }
    return {
      name: r.company_name,
      Critical: counts.critical,
      High: counts.high,
      Medium: counts.medium,
      Low: counts.low,
    };
  });
}

function buildCoverageHeatmap(comparison: ComparisonRow[], companies: string[]) {
  // For each company, count how many metrics have data
  const totalMetrics = comparison.length;
  return companies.map((company) => {
    const reported = comparison.filter((row) => row.companies[company]?.value !== null && row.companies[company]?.value !== undefined).length;
    return {
      name: company,
      reported,
      missing: totalMetrics - reported,
      coverage: totalMetrics > 0 ? Math.round((reported / totalMetrics) * 100) : 0,
    };
  });
}

// ── Chart Wrapper ─────────────────────────────────────────────────

function ChartPanel({ title, children, subtitle }: { title: string; children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

interface ComparisonChartsProps {
  result: ComparisonOutput;
}

export default function ComparisonCharts({ result }: ComparisonChartsProps) {
  const c = useChartColors();
  const tooltipStyle = buildTooltipStyle(c);

  const companies = result.coverage.companies ?? [];

  const groupedBarData = useMemo(() => buildGroupedBarData(result.comparison, companies), [result.comparison, companies]);
  const radarData = useMemo(() => buildRadarData(result.comparison, companies), [result.comparison, companies]);
  const riskScoreData = useMemo(() => result.risk_summary.map((r) => ({ name: r.company_name, 'Risk Score': r.risk_score, 'High Priority': r.critical_or_high, 'Total Flags': r.red_flag_count })), [result.risk_summary]);
  const riskDistData = useMemo(() => buildRiskDistribution(result.risk_summary), [result.risk_summary]);
  const coverageData = useMemo(() => buildCoverageHeatmap(result.comparison, companies), [result.comparison, companies]);

  const hasMetricCharts = groupedBarData.length > 0 || radarData.length > 0;
  const hasRiskCharts = riskScoreData.length > 0;

  if (!hasMetricCharts && !hasRiskCharts) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Visual Benchmark</h3>
        <span className="text-xs text-muted-foreground">— {companies.length} companies</span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* 1. Grouped Bar — Key Metrics Comparison */}
        {groupedBarData.length > 0 && (
          <ChartPanel title="Key Metrics Comparison" subtitle="Side-by-side comparison of shared financial metrics">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedBarData} margin={{ left: 0, right: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="metric" tick={{ fill: c.axis, fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: c.axis, fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => formatCompact(value)} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
                {companies.map((company, idx) => (
                  <Bar key={company} dataKey={company} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 2. Radar — Company Financial Profile */}
        {radarData.length >= 3 && (
          <ChartPanel title="Financial Profile Overlay" subtitle="Margins, returns, and ratios compared on radar">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={c.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: c.axis, fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fill: c.axis, fontSize: 9 }} />
                {companies.map((company, idx) => (
                  <Radar
                    key={company}
                    name={company}
                    dataKey={company}
                    stroke={CHART_PALETTE[idx % CHART_PALETTE.length]}
                    fill={CHART_PALETTE[idx % CHART_PALETTE.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 3. Risk Score Comparison */}
        {riskScoreData.length > 0 && (
          <ChartPanel title="Risk Score Comparison" subtitle="Risk intensity score per company">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskScoreData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} width={100} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
                <Bar dataKey="Risk Score" radius={[0, 4, 4, 0]}>
                  {riskScoreData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 4. Risk Distribution Stacked */}
        {riskDistData.length > 0 && (
          <ChartPanel title="Risk Distribution by Company" subtitle="Breakdown of risk signals by severity level">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis tick={{ fill: c.axis, fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
                <Bar dataKey="Critical" stackId="risk" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="High" stackId="risk" fill="#f97316" />
                <Bar dataKey="Medium" stackId="risk" fill="#f59e0b" />
                <Bar dataKey="Low" stackId="risk" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 5. Metric Coverage */}
        {coverageData.length > 0 && (
          <ChartPanel title="Data Coverage by Company" subtitle="How many shared metrics each company reports">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} width={100} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
                <Bar dataKey="reported" name="Reported" stackId="coverage" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="missing" name="Missing" stackId="coverage" fill="#374151" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>
    </div>
  );
}
