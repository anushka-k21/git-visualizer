import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositoryWorkspace } from '../context/RepositoryContext';
import { useRepositoryTimeline } from '../hooks/useCommits';
import { TimelineCommit, TimelineGroupBy } from '../types';

const GROUP_OPTIONS: { value: TimelineGroupBy; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const RepositoryTimelinePage: React.FC = () => {
  const { repositoryId } = useRepositoryWorkspace();
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<TimelineGroupBy>('day');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const {
    data: timeline = [],
    isLoading: timelineLoading,
    isError: timelineError,
    error: timelineErr,
    refetch,
  } = useRepositoryTimeline(repositoryId, groupBy, !!repositoryId);

  const filteredTimeline = useMemo(() => {
    if (!search.trim()) return timeline;
    const q = search.toLowerCase();

    return timeline
      .map((period) => {
        const commits = period.commits.filter(
          (c) =>
            c.hash.toLowerCase().includes(q) ||
            c.author.toLowerCase().includes(q) ||
            c.message.toLowerCase().includes(q)
        );
        if (commits.length === 0) return null;
        return { ...period, commits, commitCount: commits.length };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [timeline, search]);

  const togglePeriod = (period: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(period)) {
        next.delete(period);
      } else {
        next.add(period);
      }
      return next;
    });
  };

  const openInGraph = (commit: TimelineCommit) => {
    navigate(`/repositories/${repositoryId}/graph?commit=${commit.hash}`, {
      state: { focusCommit: commit.hash },
    });
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] mb-4">Timeline</h2>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setGroupBy(opt.value);
                  setExpanded(new Set());
                }}
                className={[
                  'px-3 py-1.5 text-xs font-mono transition-colors',
                  groupBy === opt.value
                    ? 'bg-blue-950/50 text-blue-300'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commits…"
            className="input-field flex-1 min-w-[200px] text-sm"
          />
        </div>

        {timelineLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        )}

        {timelineError && !timelineLoading && (
          <div className="card p-8 text-center">
            <p className="text-sm text-red-400 mb-4">
              {timelineErr instanceof Error ? timelineErr.message : 'Failed to load timeline'}
            </p>
            <button onClick={() => refetch()} className="btn-primary mx-auto">
              Retry
            </button>
          </div>
        )}

        {!timelineLoading && !timelineError && filteredTimeline.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              {search ? 'No commits match your search.' : 'No timeline data. Sync commits from the Graph tab first.'}
            </p>
          </div>
        )}

        {!timelineLoading && filteredTimeline.length > 0 && (
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredTimeline.map((period) => {
              const isOpen = expanded.has(period.period);
              return (
                <div key={period.period} className="card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePeriod(period.period)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--bg-secondary)]/50 transition-colors"
                  >
                    <div>
                      <span className="font-display font-semibold text-sm text-[var(--text-primary)]">
                        {period.period}
                      </span>
                      <span className="ml-3 text-xs font-mono text-[var(--text-muted)]">
                        {period.commitCount} {period.commitCount === 1 ? 'commit' : 'commits'}
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">{isOpen ? '▼' : '▶'}</span>
                  </button>

                  {isOpen && (
                    <ul className="border-t border-[var(--border)] divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                      {period.commits.map((commit) => (
                        <li key={commit.hash}>
                          <button
                            type="button"
                            onClick={() => openInGraph(commit)}
                            className="w-full px-5 py-3 text-left hover:bg-blue-950/20 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-[var(--text-primary)] truncate">
                                  {commit.message}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                  {commit.author} ·{' '}
                                  <span className="font-mono">{commit.hash.slice(0, 7)}</span>
                                </p>
                              </div>
                              <time className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                                {new Date(commit.commitDate).toLocaleString()}
                              </time>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default RepositoryTimelinePage;
