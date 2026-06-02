import React, { useMemo, useState } from 'react';
import { CommitGraph } from '../components/CommitGraph';
import { useRepositoryWorkspace } from '../context/RepositoryContext';
import { DiffViewer } from '../components/DiffViewer';
import { useRepositoryBranches, useRepositoryGraph, useSyncBranches } from '../hooks/useCommits';
import { useBranchComparison, useComparisonDiff } from '../hooks/useAdvanced';
import { filterGraphByCommitHashes } from '../utils/graphFilter';

const BranchComparisonPage: React.FC = () => {
  const { repositoryId } = useRepositoryWorkspace();
  const {
    data: branches = [],
    isLoading: branchesLoading,
    isError: branchesError,
    error: branchesErr,
    refetch: refetchBranches,
  } = useRepositoryBranches(repositoryId, !!repositoryId);
  const {
    mutate: syncBranches,
    isPending: syncingBranches,
    isError: syncBranchesError,
    error: syncBranchesErr,
  } = useSyncBranches();
  const [sourceBranch, setSourceBranch] = useState<string | null>(null);
  const [targetBranch, setTargetBranch] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');

  const { data: graph } = useRepositoryGraph(repositoryId, !!repositoryId);
  const { data: comparison, isLoading, isError, error } = useBranchComparison(
    repositoryId,
    sourceBranch,
    targetBranch,
    !!sourceBranch && !!targetBranch
  );
  const { data: diff, isLoading: diffLoading, isError: diffError, error: diffErr } =
    useComparisonDiff(repositoryId, sourceBranch, targetBranch, showDiff);

  const handleSyncBranches = () => {
    if (!repositoryId) return;
    syncBranches(repositoryId, {
      onSuccess: () => {
        setSourceBranch(null);
        setTargetBranch(null);
        refetchBranches();
      },
    });
  };

  const compareHighlights = useMemo(() => {
    if (!comparison) return undefined;
    return {
      sourceOnly: new Set(comparison.sourceUniqueCommits.map((c) => c.hash)),
      targetOnly: new Set(comparison.targetUniqueCommits.map((c) => c.hash)),
      mergeBase: comparison.mergeBase,
    };
  }, [comparison]);

  const filteredGraph = useMemo(() => {
    if (!graph || !comparison) return graph;
    const hashes = new Set([
      ...comparison.sourceUniqueCommits.map((c) => c.hash),
      ...comparison.targetUniqueCommits.map((c) => c.hash),
      comparison.mergeBase,
    ]);
    return filterGraphByCommitHashes(graph, hashes);
  }, [graph, comparison]);

  const filterCommits = (
    list: { hash: string; author: string; message: string }[],
    q: string
  ) => {
    if (!q.trim()) return list;
    const lower = q.toLowerCase();
    return list.filter(
      (c) =>
        c.message.toLowerCase().includes(lower) ||
        c.author.toLowerCase().includes(lower) ||
        c.hash.toLowerCase().includes(lower)
    );
  };

  return (
    <div className="animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">Compare</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Select two synced branches to compare commits and file changes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncBranches}
            disabled={syncingBranches || !repositoryId}
            className="btn-primary text-xs"
          >
            {syncingBranches ? 'Syncing...' : 'Sync branches'}
          </button>
        </div>

        {(branchesError || syncBranchesError) && (
          <p className="text-sm text-red-400 mt-4">
            {branchesErr instanceof Error
              ? branchesErr.message
              : syncBranchesErr instanceof Error
                ? syncBranchesErr.message
                : 'Failed to load branches'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <BranchSelect
            label="Source branch"
            value={sourceBranch}
            branches={branches}
            other={targetBranch}
            onChange={setSourceBranch}
            disabled={branchesLoading || syncingBranches || branches.length === 0}
          />
          <BranchSelect
            label="Target branch"
            value={targetBranch}
            branches={branches}
            other={sourceBranch}
            onChange={setTargetBranch}
            disabled={branchesLoading || syncingBranches || branches.length === 0}
          />
        </div>

        {branchesLoading && (
          <p className="text-sm text-[var(--text-muted)] mt-4">Loading branches...</p>
        )}

        {!branchesLoading && !branchesError && branches.length === 0 && (
          <div className="card p-5 mt-4">
            <p className="text-sm text-[var(--text-secondary)]">
              No synced branches found. Sync branches after importing and syncing commits.
            </p>
            <button
              type="button"
              onClick={handleSyncBranches}
              disabled={syncingBranches || !repositoryId}
              className="btn-primary text-xs mt-4"
            >
              {syncingBranches ? 'Syncing...' : 'Sync branches'}
            </button>
          </div>
        )}

        {sourceBranch === targetBranch && sourceBranch && (
          <p className="text-sm text-amber-400 mt-4">Select two different branches.</p>
        )}

        {isLoading && <p className="text-sm text-[var(--text-muted)] mt-6">Comparing...</p>}
        {isError && (
          <p className="text-sm text-red-400 mt-6">
            {error instanceof Error ? error.message : 'Comparison failed'}
          </p>
        )}

        {comparison && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <Stat label="Ahead" value={comparison.aheadCount} />
              <Stat label="Behind" value={comparison.behindCount} />
              <Stat label="Additions" value={comparison.additions} />
              <Stat label="Deletions" value={comparison.deletions} />
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-3 truncate">
              Merge base: {comparison.mergeBase}
            </p>

            <button
              type="button"
              onClick={() => setShowDiff(true)}
              className="btn-primary mt-4 text-xs"
            >
              View aggregate diff
            </button>

            {showDiff && (
              <div className="card mt-4 max-h-96 overflow-hidden">
                <DiffViewer diff={diff} isLoading={diffLoading} isError={diffError} error={diffErr} />
              </div>
            )}

            <div className="mt-8 h-[400px] min-h-[400px]">
              {filteredGraph && (
                <CommitGraph
                  graph={filteredGraph}
                  selectedCommitHash={comparison.mergeBase}
                  focusCommitHash={comparison.mergeBase}
                  onSelectCommit={() => {}}
                  skipFitView={false}
                  compareHighlights={compareHighlights}
                />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-8">
              <CommitList
                title="Only in source"
                commits={filterCommits(comparison.sourceUniqueCommits, searchSource)}
                search={searchSource}
                onSearchChange={setSearchSource}
              />
              <CommitList
                title="Only in target"
                commits={filterCommits(comparison.targetUniqueCommits, searchTarget)}
                search={searchTarget}
                onSearchChange={setSearchTarget}
              />
            </div>
          </>
        )}
    </div>
  );
};

const BranchSelect: React.FC<{
  label: string;
  value: string | null;
  branches: { name: string }[];
  other: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ label, value, branches, other, onChange, disabled = false }) => (
  <div className="card p-4">
    <label className="label">{label}</label>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-field mt-1 w-full"
      disabled={disabled}
    >
      <option value="">Select branch</option>
      {branches
        .filter((b) => b.name !== other)
        .map((b) => (
          <option key={b.name} value={b.name}>
            {b.name}
          </option>
        ))}
    </select>
  </div>
);

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="card p-4 text-center">
    <p className="text-xs text-[var(--text-muted)]">{label}</p>
    <p className="text-xl font-mono font-semibold text-[var(--text-primary)]">{value}</p>
  </div>
);

const CommitList: React.FC<{
  title: string;
  commits: { hash: string; author: string; message: string; commitDate?: string }[];
  search: string;
  onSearchChange: (v: string) => void;
}> = ({ title, commits, search, onSearchChange }) => (
  <div className="card overflow-hidden">
    <div className="p-4 border-b border-[var(--border)]">
      <h3 className="font-display font-semibold text-sm">{title}</h3>
      <input
        className="input-field mt-2 text-xs w-full"
        placeholder="Search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <ul className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
      {commits.map((c) => (
        <li key={c.hash} className="px-4 py-2 text-xs">
          <p className="truncate text-[var(--text-primary)]">{c.message}</p>
          <p className="text-[var(--text-muted)] font-mono mt-0.5">
            {c.author} - {c.hash.slice(0, 7)}
          </p>
        </li>
      ))}
    </ul>
  </div>
);

export default BranchComparisonPage;
