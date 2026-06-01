import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepositories';
import { useFileHistory, useFiles } from '../hooks/useAnalytics';
import { formatDate } from '../utils';

const RepositoryFilesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const repositoryId = id ?? '';
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [skip, setSkip] = useState(0);
  const [accumulatedEntries, setAccumulatedEntries] = useState<
    import('../types').FileHistoryEntry[]
  >([]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setSkip(0);
    setAccumulatedEntries([]);
  }, [selectedPath, sort]);

  const { data: repository } = useRepository(repositoryId);
  const { data: files = [], isLoading: filesLoading, isError: filesError, error: filesErr } =
    useFiles(repositoryId, debouncedSearch, !!repositoryId);

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
  } = useFileHistory(repositoryId, selectedPath, sort, skip, !!selectedPath);

  React.useEffect(() => {
    if (!history?.entries) return;
    if (skip === 0) {
      setAccumulatedEntries(history.entries);
    } else {
      setAccumulatedEntries((prev) => {
        const existing = new Set(prev.map((e) => e.hash));
        const next = history.entries.filter((e) => !existing.has(e.hash));
        return [...prev, ...next];
      });
    }
  }, [history, skip]);

  const openInGraph = (hash: string) => {
    navigate(`/repositories/${repositoryId}/graph?commit=${hash}`);
  };

  if (!repositoryId) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-sm text-[var(--text-secondary)]">Invalid repository.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)]">
      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link
            to="/repositories"
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            ← Repositories
          </Link>
          <h1 className="text-2xl font-display font-semibold text-[var(--text-primary)] mt-2">
            File evolution
          </h1>
          {repository && (
            <p className="text-sm font-mono text-[var(--text-secondary)] mt-1">
              {repository.owner}/{repository.name}
            </p>
          )}
        </div>

        <div
          className="flex flex-col lg:flex-row gap-4"
          style={{ height: 'calc(100vh - 200px)' }}
        >
          <aside className="card w-full lg:w-80 shrink-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files…"
                className="input-field text-sm w-full"
              />
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2">
                {files.length} files
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filesLoading && (
                <div className="space-y-2 p-2 animate-pulse">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 bg-[var(--bg-secondary)] rounded" />
                  ))}
                </div>
              )}
              {filesError && (
                <p className="text-xs text-red-400 p-2">
                  {filesErr instanceof Error ? filesErr.message : 'Failed to load files'}
                </p>
              )}
              {!filesLoading && files.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] p-2">No files found.</p>
              )}
              <ul className="space-y-0.5">
                {files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPath(file.path);
                        setSkip(0);
                      }}
                      className={[
                        'w-full text-left px-3 py-2 rounded-lg text-xs font-mono truncate transition-colors',
                        selectedPath === file.path
                          ? 'bg-blue-950/40 text-blue-300'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
                      ].join(' ')}
                      title={file.path}
                    >
                      {file.name}
                      <span className="block text-[10px] text-[var(--text-muted)] truncate mt-0.5 font-normal">
                        {file.path}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="card flex-1 flex flex-col min-w-0 overflow-hidden">
            {!selectedPath ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-sm text-[var(--text-muted)]">Select a file to view its history.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-blue-400/90 truncate flex-1">{selectedPath}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSort('newest');
                        setSkip(0);
                      }}
                      className={sort === 'newest' ? 'btn-primary text-xs py-1' : 'btn-ghost text-xs py-1'}
                    >
                      Newest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSort('oldest');
                        setSkip(0);
                      }}
                      className={sort === 'oldest' ? 'btn-primary text-xs py-1' : 'btn-ghost text-xs py-1'}
                    >
                      Oldest
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {historyLoading && (
                    <div className="p-8 animate-pulse space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded" />
                      ))}
                    </div>
                  )}
                  {historyError && (
                    <p className="p-6 text-sm text-red-400">
                      {historyErr instanceof Error ? historyErr.message : 'Failed to load history'}
                    </p>
                  )}
                  {accumulatedEntries.length === 0 && !historyLoading && selectedPath && (
                    <p className="p-6 text-sm text-[var(--text-muted)]">No history for this file.</p>
                  )}
                  {accumulatedEntries.length > 0 && (
                    <ul className="divide-y divide-[var(--border)]">
                      {accumulatedEntries.map((entry) => (
                        <li key={entry.hash}>
                          <button
                            type="button"
                            onClick={() => openInGraph(entry.hash)}
                            className="w-full px-5 py-4 text-left hover:bg-blue-950/20 transition-colors"
                          >
                            <p className="text-sm text-[var(--text-primary)]">{entry.message}</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--text-muted)]">
                              <span>{entry.author}</span>
                              <time>{formatDate(entry.commitDate)}</time>
                              <span className="font-mono text-blue-400/80">{entry.hash.slice(0, 12)}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {history?.hasMore && (
                  <div className="p-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setSkip((s) => s + 50)}
                      disabled={historyLoading}
                      className="btn-ghost w-full text-xs"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default RepositoryFilesPage;
