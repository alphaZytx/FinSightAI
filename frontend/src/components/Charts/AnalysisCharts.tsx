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
import { useChartColors, CHART_PALETTE, buildTooltipStyle } from '../../hooks/useChartColors';
import { formatCompact, prettifyMetricName } from '../../utils/chartUtils';
import type { AnalysisMetric, AnalysisRedFlag } from '../../types';

// ── Chart data builder helpers ───────────────────────────────────

function getMetricValue(metrics: AnalysisMetric[], name: string): number | null {
  const metric = metrics.find((m) => m.metric_name === name);
  return metric?.value ?? null;
}

const INCOME_KEYS = ['revenue', 'cost_of_revenue', 'gross_profit', 'operating_expenses', 'ebitda', 'operating_income', 'net_income'];
const INCOME_LABELS = ['Revenue', 'COGS', 'Gross Profit', 'OpEx', 'EBITDA', 'Op. Income', 'Net Income'];

function buildIncomeWaterfall(metrics: AnalysisMetric[]) {
  const data: { name: string; value: number }[] = [];
  for (let i = 0; i < INCOME_KEYS.length; i++) {
    const v = getMetricValue(metrics, INCOME_KEYS[i]);
    if (v !== null) data.push({ name: INCOME_LABELS[i], value: v });
  }
  return data;
}

const MARGIN_KEYS = ['gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin', 'roe', 'roa', 'roce'];
const MARGIN_LABELS = ['Gross', 'Operating', 'Net', 'EBITDA', 'ROE', 'ROA', 'ROCE'];

function buildMarginBars(metrics: AnalysisMetric[]) {
  const data: { name: string; value: number }[] = [];
  for (let i = 0; i < MARGIN_KEYS.length; i++) {
    const v = getMetricValue(metrics, MARGIN_KEYS[i]);
    if (v !== null) data.push({ name: MARGIN_LABELS[i], value: v });
  }
  return data;
}

const RATIO_KEYS = ['current_ratio', 'debt_to_equity', 'interest_coverage', 'debt_to_ebitda'];
const RATIO_LABELS = ['Current Ratio', 'D/E', 'Interest Cov.', 'Debt/EBITDA'];

function buildRatioRadar(metrics: AnalysisMetric[]) {
  const data: { subject: string; value: number }[] = [];
  for (let i = 0; i < RATIO_KEYS.length; i++) {
    const v = getMetricValue(metrics, RATIO_KEYS[i]);
    if (v !== null) data.push({ subject: RATIO_LABELS[i], value: v });
  }
  return data;
}

function buildConfidencePie(metrics: AnalysisMetric[]) {
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const m of metrics) {
    const conf = m.confidence ?? 0;
    if (conf >= 0.75) high++;
    else if (conf >= 0.5) medium++;
    else low++;
  }
  return [
    { name: 'High (≥75%)', value: high, fill: '#10b981' },
    { name: 'Medium (50-75%)', value: medium, fill: '#f59e0b' },
    { name: 'Low (<50%)', value: low, fill: '#ef4444' },
  ].filter((d) => d.value > 0);
}

const CATEGORY_MAP: Record<string, string[]> = {
  'Income': ['revenue', 'cost_of_revenue', 'gross_profit', 'operating_expenses', 'sga_expense', 'rd_expense', 'depreciation', 'ebitda', 'operating_income', 'interest_expense', 'pretax_income', 'tax_expense', 'net_income', 'eps', 'dps'],
  'Margins': ['gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin', 'roe', 'roa', 'roce', 'revenue_growth'],
  'Balance': ['total_assets', 'current_assets', 'cash', 'short_term_investments', 'accounts_receivable', 'inventory', 'non_current_assets', 'ppe', 'goodwill', 'total_liabilities', 'current_liabilities', 'accounts_payable', 'short_term_debt', 'long_term_debt', 'total_debt', 'total_equity', 'book_value_per_share'],
  'Cash Flow': ['operating_cash_flow', 'capex', 'free_cash_flow', 'investing_cash_flow', 'financing_cash_flow', 'dividends_paid'],
  'Ratios': ['current_ratio', 'debt_to_equity', 'debt_to_ebitda', 'interest_coverage', 'working_capital'],
};

function buildMetricsByCategory(metrics: AnalysisMetric[]) {
  const counts: Record<string, number> = {};
  for (const [category, keys] of Object.entries(CATEGORY_MAP)) {
    const count = metrics.filter((m) => keys.includes(m.metric_name)).length;
    if (count > 0) counts[category] = count;
  }
  const other = metrics.filter((m) => {
    const allKeys = Object.values(CATEGORY_MAP).flat();
    return !allKeys.includes(m.metric_name);
  }).length;
  if (other > 0) counts['Other'] = other;
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function buildRiskBySeverity(redFlags: AnalysisRedFlag[]) {
  const counts: Record<string, number> = {};
  const order = ['critical', 'high', 'medium', 'low'];
  for (const flag of redFlags) {
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
  return order
    .filter((s) => counts[s])
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: counts[s],
      fill: severityColors[s],
    }));
}

// ── Chart Wrapper ─────────────────────────────────────────────────

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</h4>
      <div className="h-56">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

interface AnalysisChartsProps {
  metrics: AnalysisMetric[];
  redFlags: AnalysisRedFlag[];
}

export default function AnalysisCharts({ metrics, redFlags }: AnalysisChartsProps) {
  const c = useChartColors();
  const tooltipStyle = buildTooltipStyle(c);

  const incomeData = useMemo(() => buildIncomeWaterfall(metrics), [metrics]);
  const marginData = useMemo(() => buildMarginBars(metrics), [metrics]);
  const ratioData = useMemo(() => buildRatioRadar(metrics), [metrics]);
  const confData = useMemo(() => buildConfidencePie(metrics), [metrics]);
  const categoryData = useMemo(() => buildMetricsByCategory(metrics), [metrics]);
  const riskData = useMemo(() => buildRiskBySeverity(redFlags), [redFlags]);

  const hasCharts = incomeData.length > 0 || marginData.length > 0 || ratioData.length > 0 || confData.length > 0;

  if (!hasCharts && riskData.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Visual Analysis</h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Income Waterfall */}
        {incomeData.length > 0 && (
          <ChartPanel title="Income Statement Waterfall">
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

        {/* 2. Margin Horizontal Bars */}
        {marginData.length > 0 && (
          <ChartPanel title="Margins & Returns (%)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: c.axis, fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} width={70} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {marginData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.value >= 0 ? CHART_PALETTE[1] : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 3. Financial Ratios Spider */}
        {ratioData.length >= 3 && (
          <ChartPanel title="Financial Ratios">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={ratioData}>
                <PolarGrid stroke={c.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: c.axis, fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: c.axis, fontSize: 9 }} />
                <Radar name="Value" dataKey="value" stroke={c.radarPrimary} fill={c.radarPrimary} fillOpacity={0.35} strokeWidth={2} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 4. Extraction Confidence */}
        {confData.length > 0 && (
          <ChartPanel title="Extraction Confidence">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={confData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
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
          </ChartPanel>
        )}

        {/* 5. Metrics by Category */}
        {categoryData.length > 0 && (
          <ChartPanel title="Metrics by Category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis tick={{ fill: c.axis, fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {/* 6. Risk Severity */}
        {riskData.length > 0 && (
          <ChartPanel title="Risk Signals by Severity">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 10 }} />
                <YAxis tick={{ fill: c.axis, fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>
    </div>
  );
}
