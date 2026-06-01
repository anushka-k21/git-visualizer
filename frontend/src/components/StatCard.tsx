import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, loading }) => (
  <div className="card p-5">
    {loading ? (
      <div className="animate-pulse space-y-2">
        <div className="h-3 w-24 bg-[var(--bg-secondary)] rounded" />
        <div className="h-7 w-16 bg-[var(--bg-secondary)] rounded" />
      </div>
    ) : (
      <>
        <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-display font-semibold text-[var(--text-primary)] mt-1">{value}</p>
        {subtext && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{subtext}</p>
        )}
      </>
    )}
  </div>
);
