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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useChartColors, CHART_PALETTE, buildTooltipStyle } from '../../hooks/useChartColors';
import { formatCompact, truncateLabel } from '../../utils/chartUtils';
import type { ReportOutput } from '../../services/api/reports';
import type { WorkspaceAnalysis, AnalysisMetric } from '../../types';

// ── Data builders ────────────────────────────────────────────────

function buildCoveragePie(coverage: ReportOutput['coverage']) {
  if (!coverage) return [];
  return [
    { name: 'Documents', value: coverage.documents ?? 0, fill: '#3b82f6' },
    { name: 'Metrics', value: coverage.metrics ?? 0, fill: '#10b981' },
    { name: 'Risk Signals', value: coverage.red_flags ?? 0, fill: '#f59e0b' },
  ].filter((d) => d.value > 0);
}

function buildSectionsBars(sections: ReportOutput['sections']) {
  if (!sections || sections.length === 0) return [];
  return sections.map((section) => ({
    name: truncateLabel(section.heading, 20),
    fullName: section.heading,
    words: section.content.split(/\s+/).length,
  }));
}

function getMetricValue(metrics: AnalysisMetric[], name: string): number | null {
  const metric = metrics.find((m) => m.metric_name === name);
  return metric?.value ?? null;
}

function buildIncomeSnapshot(metrics: AnalysisMetric[]) {
  const keys = ['revenue', 'gross_profit', 'ebitda', 'operating_income', 'net_income'];
  const labels = ['Revenue', 'Gross Profit', 'EBITDA', 'Op. Income', 'Net Income'];
  const data: { name: string; value: number }[] = [];
  for (let i = 0; i < keys.length; i++) {
    const v = getMetricValue(metrics, keys[i]);
    if (v !== null) data.push({ name: labels[i], value: v });
  }
  return data;
}

function buildMarginSnapshot(metrics: AnalysisMetric[]) {
  const keys = ['gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin', 'roe', 'roa'];
  const labels = ['Gross', 'Operating', 'Net', 'EBITDA', 'ROE', 'ROA'];
  const data: { subject: string; value: number }[] = [];
  for (let i = 0; i < keys.length; i++) {
    const v = getMetricValue(metrics, keys[i]);
    if (v !== null) data.push({ subject: labels[i], value: v });
  }
  return data;
}

function buildRiskSummary(analysis: WorkspaceAnalysis) {
  const counts: Record<string, number> = {};
  for (const flag of analysis.red_flags) {
    const s = flag.severity || 'unknown';
    counts[s] = (counts[s] || 0) + 1;
  }
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#6366f1',
    unknown: '#94a3b8',
  };
  return Object.entries(counts).map(([s, count]) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: count,
    fill: severityColors[s] || '#94a3b8',
  }));
}

// ── Chart Wrapper ─────────────────────────────────────────────────

function ChartPanel({ title, children, subtitle }: { title: string; children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-56">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

interface ReportChartsProps {
  result: ReportOutput;
  analysis?: WorkspaceAnalysis;
}

export default function ReportCharts({ result, analysis }: ReportChartsProps) {
  const c = useChartColors();
  const tooltipStyle = buildTooltipStyle(c);

  const coverageData = useMemo(() => buildCoveragePie(result.coverage), [result.coverage]);
  const sectionsData = useMemo(() => buildSectionsBars(result.sections), [result.sections]);
  const incomeData = useMemo(() => analysis ? buildIncomeSnapshot(analysis.metrics) : [], [analysis]);
  const marginData = useMemo(() => analysis ? buildMarginSnapshot(analysis.metrics) : [], [analysis]);
  const riskData = useMemo(() => analysis ? buildRiskSummary(analysis) : [], [analysis]);

  const hasCharts = coverageData.length > 0 || sectionsData.length > 0 || incomeData.length > 0;

  if (!hasCharts) return null;

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Report Visualizations</h4>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 1. Report Coverage */}
        {coverageData.length > 0 && (
          <ChartPanel title="Report Coverage" subtitle="Data sources included in this report">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coverageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {coverageData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 2. Section Content Density */}
        {sectionsData.length > 0 && (
          <ChartPanel title="Report Sections" subtitle="Content density by section (word count)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionsData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: c.axis, fontSize: 9 }} width={120} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: number, _name: string, props: { payload: { fullName: string } }) => [`${value} words`, props.payload.fullName]}
                />
                <Bar dataKey="words" name="Words" radius={[0, 4, 4, 0]}>
                  {sectionsData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 3. Financial Snapshot — Income */}
        {incomeData.length > 0 && (
          <ChartPanel title="Financial Snapshot" subtitle="Key income statement figures from analyzed filings">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} width={80} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => formatCompact(value)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {incomeData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 4. Margin Radar */}
        {marginData.length >= 3 && (
          <ChartPanel title="Margin Profile" subtitle="Profitability and return metrics">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={marginData}>
                <PolarGrid stroke={c.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: c.axis, fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: c.axis, fontSize: 9 }} />
                <Radar name="Value" dataKey="value" stroke={c.radarPrimary} fill={c.radarPrimary} fillOpacity={0.35} strokeWidth={2} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => `${value.toFixed(2)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 5. Risk Summary */}
        {riskData.length > 0 && (
          <ChartPanel title="Risk Signal Summary" subtitle="Severity distribution of detected risks">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>
    </div>
  );
}
