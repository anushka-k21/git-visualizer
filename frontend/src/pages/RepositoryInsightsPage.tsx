import React, { useState } from 'react';
import { ContributorCharts } from '../components/ContributorCharts';
import { ContributionHeatmap } from '../components/ContributionHeatmap';
import { StatCard } from '../components/StatCard';
import { useRepositoryWorkspace } from '../context/RepositoryContext';
import {
  useContributors,
  useHeatmap,
  useRepositoryStats,
  useSyncContributors,
} from '../hooks/useAnalytics';
import { HeatmapRange } from '../types';
import { formatDate } from '../utils';

const RepositoryInsightsPage: React.FC = () => {
  const { repositoryId } = useRepositoryWorkspace();
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>('1y');
  const [selectedContributorId, setSelectedContributorId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr, refetch } =
    useRepositoryStats(repositoryId, !!repositoryId);
  const { data: contributors = [], isLoading: contributorsLoading } = useContributors(
    repositoryId,
    !!repositoryId
  );
  const { data: heatmap = [], isLoading: heatmapLoading } = useHeatmap(
    repositoryId,
    heatmapRange,
    !!repositoryId
  );
  const { mutate: syncContributors, isPending: syncingContributors } = useSyncContributors();

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">Insights</h2>
        <button
          type="button"
          onClick={() => syncContributors(repositoryId)}
          disabled={syncingContributors}
          className="btn-primary text-xs"
        >
          {syncingContributors ? 'Syncing…' : 'Sync contributors'}
        </button>
      </div>

        {statsError && (
          <div className="card p-6 mb-6 text-center">
            <p className="text-sm text-red-400 mb-3">
              {statsErr instanceof Error ? statsErr.message : 'Failed to load stats'}
            </p>
            <button onClick={() => refetch()} className="btn-primary mx-auto">
              Retry
            </button>
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="Total commits" value={stats?.totalCommits ?? '—'} loading={statsLoading} />
            <StatCard
              label="Contributors"
              value={stats?.totalContributors ?? '—'}
              loading={statsLoading}
            />
            <StatCard
              label="Repository age"
              value={stats ? `${stats.repositoryAgeYears} years` : '—'}
              subtext={stats?.firstCommitDate ? `Since ${formatDate(stats.firstCommitDate)}` : undefined}
              loading={statsLoading}
            />
            <StatCard
              label="Most active"
              value={stats?.mostActiveContributor?.name ?? '—'}
              subtext={
                stats?.mostActiveContributor
                  ? `${stats.mostActiveContributor.totalCommits} commits`
                  : undefined
              }
              loading={statsLoading}
            />
            <StatCard label="Branches" value={stats?.totalBranches ?? '—'} loading={statsLoading} />
            <StatCard
              label="Merge commits"
              value={stats?.totalMergeCommits ?? '—'}
              loading={statsLoading}
            />
            <StatCard
              label="Avg commits / day"
              value={stats?.averageCommitsPerDay ?? '—'}
              loading={statsLoading}
            />
            <StatCard
              label="Active (30 days)"
              value={stats?.activeContributorsLast30Days ?? '—'}
              loading={statsLoading}
            />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Charts
          </h2>
          <ContributorCharts stats={stats} loading={statsLoading} />
        </section>

        <section className="mb-10">
          <ContributionHeatmap
            entries={heatmap}
            loading={heatmapLoading}
            range={heatmapRange}
            onRangeChange={setHeatmapRange}
          />
        </section>

        <section>
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Top contributors
          </h2>
          <div className="card overflow-hidden">
            {contributorsLoading ? (
              <div className="p-8 animate-pulse h-32" />
            ) : contributors.length === 0 ? (
              <p className="p-6 text-sm text-[var(--text-muted)]">
                Sync commits and contributors to see rankings.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
                {contributors.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedContributorId(selectedContributorId === c.id ? null : c.id)
                      }
                      className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-[var(--bg-secondary)]/50 transition-colors"
                    >
                      <span className="text-xs font-mono text-[var(--text-muted)] w-6">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{c.name}</p>
                        <p className="text-xs font-mono text-[var(--text-muted)] truncate">{c.email}</p>
                      </div>
                      <span className="text-sm font-mono text-blue-400/90 shrink-0">
                        {c.totalCommits}
                      </span>
                    </button>
                    {selectedContributorId === c.id && (
                      <div className="px-5 pb-3 text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border)] bg-[var(--bg-secondary)]/30">
                        First: {formatDate(c.firstCommitDate)} · Last:{' '}
                        {formatDate(c.lastCommitDate)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
    </div>
  );
};

export default RepositoryInsightsPage;
