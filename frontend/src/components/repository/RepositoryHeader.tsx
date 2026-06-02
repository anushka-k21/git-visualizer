import React from 'react';
import { useRepositoryWorkspace } from '../../context/RepositoryContext';
import { formatDate, formatRelativeTime } from '../../utils';
import { RepositoryBackLink } from './RepositoryBackLink';

export const RepositoryHeader: React.FC = () => {
  const { repository, isLoading, commitCount, branchCount, lastActivityLabel, stats } =
    useRepositoryWorkspace();

  if (isLoading && !repository) {
    return (
      <header className="card p-5 mb-4 animate-pulse">
        <div className="h-6 w-48 bg-[var(--bg-secondary)] rounded mb-2" />
        <div className="h-4 w-full max-w-md bg-[var(--bg-secondary)] rounded" />
      </header>
    );
  }

  if (!repository) return null;

  const lastSyncText = stats?.latestCommitDate
    ? `Latest commit ${formatRelativeTime(stats.latestCommitDate)}`
    : `Imported ${formatRelativeTime(repository.createdAt)}`;

  return (
    <header className="card p-5 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <RepositoryBackLink className="mb-3" />
          <h1 className="font-display font-semibold text-xl text-[var(--text-primary)] tracking-tight truncate">
            {repository.owner}
            <span className="text-[var(--text-muted)] mx-1.5">/</span>
            {repository.name}
          </h1>
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-400/90 hover:text-blue-300 mt-1 block truncate"
          >
            {repository.url}
          </a>
        </div>

        <dl className="flex flex-wrap gap-4 text-right shrink-0">
          <MetaItem label="Commits" value={commitCount.toLocaleString()} />
          <MetaItem label="Branches" value={branchCount.toLocaleString()} />
          <div className="min-w-[120px]">
            <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Activity
            </dt>
            <dd className="text-xs text-[var(--text-secondary)] mt-0.5" title={lastActivityLabel ? formatDate(lastActivityLabel) : undefined}>
              {lastSyncText}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
};

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">{label}</dt>
    <dd className="text-sm font-mono font-semibold text-[var(--text-primary)] mt-0.5">{value}</dd>
  </div>
);
