import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRepositoryWorkspace } from '../../context/RepositoryContext';

const SECTION_LABELS: Record<string, string> = {
  graph: 'Graph',
  timeline: 'Timeline',
  files: 'Files',
  insights: 'Insights',
  compare: 'Compare',
  playback: 'Playback',
  impact: 'Impact',
};

export const RepositoryBreadcrumbs: React.FC = () => {
  const { repository } = useRepositoryWorkspace();
  const location = useLocation();

  const segments = location.pathname.split('/').filter(Boolean);
  const sectionKey = segments[segments.length - 1] ?? 'graph';
  const sectionLabel = SECTION_LABELS[sectionKey] ?? sectionKey;

  const repoLabel = repository
    ? `${repository.owner}/${repository.name}`
    : 'Repository';

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] mb-4"
      aria-label="Breadcrumb"
    >
      <Link
        to="/repositories"
        className="hover:text-[var(--text-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded px-0.5"
      >
        Repositories
      </Link>
      <span aria-hidden className="text-[var(--text-muted)]/60">
        /
      </span>
      <Link
        to={`/repositories/${repository?.id ?? ''}/graph`}
        className="hover:text-[var(--text-secondary)] transition-colors truncate max-w-[200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded px-0.5"
        title={repoLabel}
      >
        {repoLabel}
      </Link>
      <span aria-hidden className="text-[var(--text-muted)]/60">
        /
      </span>
      <span className="text-[var(--text-primary)]" aria-current="page">
        {sectionLabel}
      </span>
    </nav>
  );
};
