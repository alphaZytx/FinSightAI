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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '../Common';
import { useChartColors, CHART_PALETTE, buildTooltipStyle } from '../../hooks/useChartColors';
import { formatCompact, prettifyMetricName } from '../../utils/chartUtils';
import type { WorkspaceAnalysis, AnalysisMetric, AnalysisRedFlag } from '../../types';
import { BarChart3 } from 'lucide-react';

function MiniChart({ title, children, colSpan }: { title: string; children: React.ReactNode; colSpan?: number }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4${colSpan ? ` lg:col-span-${colSpan}` : ''}`} style={colSpan ? { gridColumn: `span ${colSpan}` } : undefined}>
      <h4 className="mb-3 text-xs font-medium text-foreground-muted">{title}</h4>
      <div className="h-52">{children}</div>
    </div>
  );
}

// ── Helpers to extract chart-ready data from metrics ───────────────

function getMetricValue(metrics: AnalysisMetric[], name: string): number | null {
  const metric = metrics.find((m) => m.metric_name === name);
  return metric?.value ?? null;
}

function buildIncomeWaterfall(metrics: AnalysisMetric[]) {
  const keys = ['revenue', 'gross_profit', 'ebitda', 'operating_income', 'net_income'];
  const labels = ['Revenue', 'Gross Profit', 'EBITDA', 'Op. Income', 'Net Income'];
  const data: { name: string; value: number }[] = [];
  for (let i = 0; i < keys.length; i++) {
    const v = getMetricValue(metrics, keys[i]);
    if (v !== null) data.push({ name: labels[i], value: v });
  }
  return data;
}

function buildMarginRadar(metrics: AnalysisMetric[]) {
  const keys = ['gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin', 'roe', 'roa'];
  const labels = ['Gross Margin', 'Op. Margin', 'Net Margin', 'EBITDA Margin', 'ROE', 'ROA'];
  const data: { subject: string; value: number }[] = [];
  for (let i = 0; i < keys.length; i++) {
    const v = getMetricValue(metrics, keys[i]);
    if (v !== null) data.push({ subject: labels[i], value: v });
  }
  return data;
}

function buildBalanceSheet(metrics: AnalysisMetric[]) {
  const assets = getMetricValue(metrics, 'total_assets');
  const currentAssets = getMetricValue(metrics, 'current_assets');
  const liabilities = getMetricValue(metrics, 'total_liabilities');
  const currentLiab = getMetricValue(metrics, 'current_liabilities');
  const equity = getMetricValue(metrics, 'total_equity');
  const data: { name: string; value: number }[] = [];
  if (assets !== null) data.push({ name: 'Total Assets', value: assets });
  if (currentAssets !== null) data.push({ name: 'Current Assets', value: currentAssets });
  if (liabilities !== null) data.push({ name: 'Total Liabilities', value: liabilities });
  if (currentLiab !== null) data.push({ name: 'Current Liab.', value: currentLiab });
  if (equity !== null) data.push({ name: 'Total Equity', value: equity });
  return data;
}

function buildCashFlowBreakdown(metrics: AnalysisMetric[]) {
  const keys = ['operating_cash_flow', 'investing_cash_flow', 'financing_cash_flow', 'free_cash_flow'];
  const labels = ['Operating', 'Investing', 'Financing', 'Free CF'];
  const data: { name: string; value: number }[] = [];
  for (let i = 0; i < keys.length; i++) {
    const v = getMetricValue(metrics, keys[i]);
    if (v !== null) data.push({ name: labels[i], value: v });
  }
  return data;
}

function buildRiskDistribution(redFlags: AnalysisRedFlag[]) {
  const counts: Record<string, number> = {};
  for (const flag of redFlags) {
    const severity = flag.severity || 'unknown';
    counts[severity] = (counts[severity] || 0) + 1;
  }
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#6366f1',
    unknown: '#94a3b8',
  };
  return Object.entries(counts).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    fill: severityColors[severity] || '#94a3b8',
  }));
}

function buildConfidenceDistribution(metrics: AnalysisMetric[]) {
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const m of metrics) {
    const c = m.confidence ?? 0;
    if (c >= 0.75) high++;
    else if (c >= 0.5) medium++;
    else low++;
  }
  return [
    { name: 'High (≥75%)', value: high, fill: '#10b981' },
    { name: 'Medium (50-75%)', value: medium, fill: '#f59e0b' },
    { name: 'Low (<50%)', value: low, fill: '#ef4444' },
  ].filter((d) => d.value > 0);
}

// ── Main Component ────────────────────────────────────────────────

interface FinancialChartsProps {
  analysis?: WorkspaceAnalysis;
}

export default function FinancialCharts({ analysis }: FinancialChartsProps) {
  const c = useChartColors();
  const tooltipStyle = buildTooltipStyle(c);

  const metrics = analysis?.metrics ?? [];
  const redFlags = analysis?.red_flags ?? [];

  const incomeData = useMemo(() => buildIncomeWaterfall(metrics), [metrics]);
  const marginData = useMemo(() => buildMarginRadar(metrics), [metrics]);
  const balanceData = useMemo(() => buildBalanceSheet(metrics), [metrics]);
  const cashFlowData = useMemo(() => buildCashFlowBreakdown(metrics), [metrics]);
  const riskData = useMemo(() => buildRiskDistribution(redFlags), [redFlags]);
  const confData = useMemo(() => buildConfidenceDistribution(metrics), [metrics]);

  const hasAnyData = incomeData.length > 0 || marginData.length > 0 || balanceData.length > 0 || cashFlowData.length > 0;

  if (!hasAnyData && riskData.length === 0) {
    return (
      <Card title="Financial Charts" subtitle="Key metrics and trends">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/15">
            <BarChart3 className="h-7 w-7 text-primary-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-foreground-muted">No financial data yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Upload and analyze a financial document in the Workspace to see real data-driven charts here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Financial Charts" subtitle={`Visualizing extracted data from ${analysis?.summary.company_count ?? 0} company filings`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* 1. Income Waterfall */}
        {incomeData.length > 0 && (
          <MiniChart title="Income Statement Waterfall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} width={75} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => formatCompact(value)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {incomeData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </MiniChart>
        )}

        {/* 2. Margin Profile Radar */}
        {marginData.length >= 3 && (
          <MiniChart title="Margin & Return Profile">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={marginData}>
                <PolarGrid stroke={c.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: c.axis, fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fill: c.axis, fontSize: 9 }} />
                <Radar name="Actual" dataKey="value" stroke={c.radarPrimary} fill={c.radarPrimary} fillOpacity={0.35} strokeWidth={2} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => `${value.toFixed(2)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </MiniChart>
        )}

        {/* 3. Balance Sheet Composition */}
        {balanceData.length > 0 && (
          <MiniChart title="Balance Sheet Snapshot">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: c.axis, fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => formatCompact(value)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {balanceData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[(idx + 3) % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </MiniChart>
        )}

        {/* 4. Cash Flow Breakdown */}
        {cashFlowData.length > 0 && (
          <MiniChart title="Cash Flow Breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis tick={{ fill: c.axis, fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => formatCompact(value)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {cashFlowData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </MiniChart>
        )}

        {/* 5. Risk Severity Distribution */}
        {riskData.length > 0 && (
          <MiniChart title="Risk Severity Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
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
          </MiniChart>
        )}

        {/* 6. Confidence Distribution */}
        {confData.length > 0 && (
          <MiniChart title="Extraction Confidence">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {confData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: c.legendText }} />
              </PieChart>
            </ResponsiveContainer>
          </MiniChart>
        )}
      </div>
    </Card>
  );
}
