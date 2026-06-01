import React, { memo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RepositoryStats } from '../types';

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
];

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(59, 130, 246, 0.25)',
  borderRadius: '8px',
  color: '#e2e8f0',
};

interface ContributorChartsProps {
  stats: RepositoryStats | undefined;
  loading?: boolean;
}

export const ContributorCharts: React.FC<ContributorChartsProps> = memo(({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  const barData = stats.commitsByContributor.slice(0, 10);
  const pieData = stats.commitsByContributor.slice(0, 8);
  const lineData = stats.commitsOverTime;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Commits per contributor">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              angle={-35}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Bar dataKey="totalCommits" name="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Commits over time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
            <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="count"
              name="Commits"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contributor activity trend">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
            <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="count"
              name="Commits"
              stroke="#3b82f6"
              fill="url(#activityGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contribution share">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="totalCommits"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${(name ?? '').slice(0, 12)} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: '#64748b' }}
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
});

ContributorCharts.displayName = 'ContributorCharts';

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card p-4">
    <h3 className="text-sm font-display font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
    {children}
  </div>
);
