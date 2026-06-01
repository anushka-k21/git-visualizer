import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RepositoryCard } from '../components/RepositoryCard';
import { useRepositories } from '../hooks/useRepositories';

const RepositoryPage: React.FC = () => {
  const { data: repositories, isLoading, isError, error, refetch } = useRepositories();
  const [search, setSearch] = useState('');

  const filtered = repositories?.filter((repo) => {
    const q = search.toLowerCase();
    return (
      repo.name.toLowerCase().includes(q) ||
      repo.owner.toLowerCase().includes(q) ||
      repo.url.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Decorative grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-display font-semibold text-[var(--text-primary)] tracking-tight">
              Repositories
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {repositories?.length
                ? `${repositories.length} ${repositories.length === 1 ? 'repository' : 'repositories'} imported`
                : 'No repositories yet'}
            </p>
          </div>

          <Link to="/" className="btn-primary">
            <PlusIcon />
            Import
          </Link>
        </div>

        {/* Search bar */}
        {(repositories?.length ?? 0) > 0 && (
          <div className="mb-6 animate-slide-up">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, owner, or URL…"
                className="input-field pl-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="card p-8 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/30 flex items-center justify-center mx-auto mb-4">
              <AlertIcon />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)] mb-1">
              Failed to load repositories
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 font-mono">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <button onClick={() => refetch()} className="btn-primary mx-auto">
              <RefreshIcon />
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && repositories?.length === 0 && (
          <div className="card p-12 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'rgba(59,130,246,0.06)',
                borderColor: 'rgba(59,130,246,0.15)',
              }}
            >
              <EmptyIcon />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)] text-lg mb-2">
              No repositories yet
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs mx-auto leading-relaxed">
              Import your first repository to start visualizing commit history and branch structure.
            </p>
            <Link to="/" className="btn-primary inline-flex mx-auto">
              <PlusIcon />
              Import Repository
            </Link>
          </div>
        )}

        {/* Repository list */}
        {!isLoading && !isError && filtered && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((repo, i) => (
              <div key={repo.id} style={{ animationDelay: `${i * 60}ms` }}>
                <RepositoryCard repository={repo} />
              </div>
            ))}
          </div>
        )}

        {/* No search results */}
        {!isLoading && !isError && filtered?.length === 0 && search && (
          <div className="card p-8 text-center animate-fade-in">
            <p className="text-sm text-[var(--text-secondary)]">
              No repositories matching <span className="font-mono text-[var(--text-primary)]">"{search}"</span>
            </p>
            <button onClick={() => setSearch('')} className="btn-ghost mx-auto mt-3">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SkeletonCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="card p-5 animate-pulse" style={style}>
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 rounded-lg bg-[var(--bg-secondary)]" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 bg-[var(--bg-secondary)] rounded w-1/3" />
        <div className="h-3 bg-[var(--bg-secondary)] rounded w-2/3" />
        <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/4" />
      </div>
    </div>
  </div>
);

// ── Icons ─────────────────────────────────────────────────

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-8 h-8 text-blue-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

export default RepositoryPage;
