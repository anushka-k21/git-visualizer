import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BranchSidebar } from '../components/BranchSidebar';
import { CommitDetailsPanel } from '../components/CommitDetailsPanel';
import { CommitGraph } from '../components/CommitGraph';
import { useRepositoryWorkspace } from '../context/RepositoryContext';
import {
  useRepositoryBranches,
  useRepositoryCommits,
  useRepositoryGraph,
  useSyncBranches,
  useSyncRepository,
} from '../hooks/useCommits';
import { collectAncestorHashesFromList } from '../utils/branchAncestors';
import { filterGraphByCommitHashes } from '../utils/graphFilter';

const RepositoryGraphPage: React.FC = () => {
  const { repositoryId } = useRepositoryWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const focusFromUrl = searchParams.get('commit');
  const branchFromUrl = searchParams.get('branch');

  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(focusFromUrl);
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(branchFromUrl);
  const [focusCommitHash, setFocusCommitHash] = useState<string | null>(focusFromUrl);

  const {
    data: graph,
    isLoading: graphLoading,
    isError: graphError,
    error: graphErr,
    refetch: refetchGraph,
  } = useRepositoryGraph(repositoryId, !!repositoryId);
  const { data: commits } = useRepositoryCommits(repositoryId, !!repositoryId);
  const {
    data: branches = [],
    isLoading: branchesLoading,
    isError: branchesError,
    error: branchesErr,
  } = useRepositoryBranches(repositoryId, !!repositoryId);

  const { mutate: sync, isPending: isSyncing, isError: syncError, error: syncErr, data: syncResult } =
    useSyncRepository();
  const { mutate: syncBranches, isPending: isSyncingBranches } = useSyncBranches();

  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    if (!selectedBranchName || !commits?.length) return graph;

    const branch = branches.find((b) => b.name === selectedBranchName);
    if (!branch) return graph;

    const ancestors = collectAncestorHashesFromList(branch.headCommitHash, commits);
    return filterGraphByCommitHashes(graph, ancestors);
  }, [graph, selectedBranchName, commits, branches]);

  const displayGraph = filteredGraph ?? graph;
  const hasGraph = (displayGraph?.nodes.length ?? 0) > 0;

  useEffect(() => {
    if (focusFromUrl) {
      setSelectedCommitHash(focusFromUrl);
      setFocusCommitHash(focusFromUrl);
    }
  }, [focusFromUrl]);

  useEffect(() => {
    if (branchFromUrl !== selectedBranchName) {
      setSelectedBranchName(branchFromUrl);
    }
  }, [branchFromUrl, selectedBranchName]);

  const handleSync = () => {
    sync(repositoryId, { onSuccess: () => refetchGraph() });
  };

  const handleSelectCommit = (hash: string | null) => {
    setSelectedCommitHash(hash);
    const next = new URLSearchParams(searchParams);
    if (hash) next.set('commit', hash);
    else next.delete('commit');
    setSearchParams(next, { replace: true });
  };

  const handleSelectBranch = (name: string | null) => {
    setSelectedBranchName(name);
    const next = new URLSearchParams(searchParams);
    if (name) next.set('branch', name);
    else next.delete('branch');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">Commit graph</h2>
        <button onClick={handleSync} disabled={isSyncing} className="btn-primary text-xs">
          {isSyncing ? 'Syncing…' : 'Sync commits'}
        </button>
      </div>

      {syncResult && (
        <p className="text-xs font-mono text-emerald-400/90 mb-4">
          Parsed {syncResult.commitsParsed} commits, stored {syncResult.commitsStored} new.
        </p>
      )}

      {(syncError || syncErr) && (
        <div className="card p-4 mb-4 border-red-800/30">
          <p className="text-sm text-red-400">
            {syncErr instanceof Error ? syncErr.message : 'Sync failed'}
          </p>
        </div>
      )}

      {graphLoading && (
        <div className="card p-12 flex items-center justify-center min-h-[480px] animate-pulse">
          <p className="text-sm text-[var(--text-muted)] font-mono">Loading graph…</p>
        </div>
      )}

      {graphError && !graphLoading && (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-400 font-mono mb-4">
            {graphErr instanceof Error ? graphErr.message : 'Failed to load graph'}
          </p>
          <button onClick={() => refetchGraph()} className="btn-primary mx-auto">
            Retry
          </button>
        </div>
      )}

      {!graphLoading && !graphError && !hasGraph && (
        <div className="card p-12 text-center">
          <h3 className="font-display font-semibold text-[var(--text-primary)] mb-2">
            No commits synced yet
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
            Sync this repository to parse commit history, then sync branches from the sidebar.
          </p>
          <button onClick={handleSync} disabled={isSyncing} className="btn-primary mx-auto">
            {isSyncing ? 'Syncing…' : 'Sync repository'}
          </button>
        </div>
      )}

      {!graphLoading && !graphError && hasGraph && displayGraph && (
        <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
          <BranchSidebar
            branches={branches}
            selectedBranchName={selectedBranchName}
            activeBranch={graph?.activeBranch ?? null}
            isLoading={branchesLoading}
            isError={branchesError}
            error={branchesErr}
            onSelectBranch={handleSelectBranch}
            onSyncBranches={() => syncBranches(repositoryId)}
            isSyncing={isSyncingBranches}
          />

          <div className="flex-1 min-w-0 min-h-[400px]">
            <CommitGraph
              graph={displayGraph}
              selectedCommitHash={selectedCommitHash}
              focusCommitHash={focusCommitHash}
              onSelectCommit={handleSelectCommit}
              skipFitView={!!selectedBranchName}
            />
          </div>

          <CommitDetailsPanel repositoryId={repositoryId} commitHash={selectedCommitHash} />
        </div>
      )}
    </div>
  );
};

export default RepositoryGraphPage;
