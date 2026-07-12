import {
  LineChart,
  Line,
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
} from 'recharts';
import {
  revenueData,
  profitData,
  debtEquityData,
  cashFlowData,
  financialRatios,
} from '../../services/mockData';
import { Card } from '../Common';

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8' },
};

function MiniChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-700/40 bg-surface-900/40 p-4">
      <h4 className="mb-3 text-xs font-medium text-surface-300">{title}</h4>
      <div className="h-40">{children}</div>
    </div>
  );
}

export default function FinancialCharts() {
  const ratioRadarData = financialRatios.map((r) => ({
    subject: r.name,
    value: r.value,
    benchmark: r.benchmark,
  }));

  return (
    <Card title="Financial Charts" subtitle="Key metrics and trends">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <MiniChart title="Revenue Trend ($M)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </MiniChart>

        <MiniChart title="Profit Trend ($M)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </MiniChart>

        <MiniChart title="Cash Flow ($M)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MiniChart>

        <MiniChart title="Debt vs Equity ($M)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={debtEquityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="debt" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="equity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MiniChart>

        <div className="rounded-lg border border-surface-700/40 bg-surface-900/40 p-4 lg:col-span-2">
          <h4 className="mb-3 text-xs font-medium text-surface-300">Financial Ratios</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={ratioRadarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Actual" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="Benchmark" dataKey="benchmark" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Tooltip {...chartTooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
