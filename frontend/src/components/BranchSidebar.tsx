import React from 'react';
import { BranchListItem } from '../types';

interface BranchSidebarProps {
  branches: BranchListItem[];
  selectedBranchName: string | null;
  activeBranch: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onSelectBranch: (name: string | null) => void;
  onSyncBranches: () => void;
  isSyncing: boolean;
}

export const BranchSidebar: React.FC<BranchSidebarProps> = ({
  branches,
  selectedBranchName,
  activeBranch,
  isLoading,
  isError,
  error,
  onSelectBranch,
  onSyncBranches,
  isSyncing,
}) => {
  return (
    <aside className="card w-full lg:w-56 shrink-0 flex flex-col max-h-[calc(100vh-220px)]">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
        <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">Branches</h2>
        <button
          type="button"
          onClick={onSyncBranches}
          disabled={isSyncing}
          className="btn-ghost text-[10px] px-2 py-1"
          title="Sync branches from Git"
        >
          {isSyncing ? '…' : 'Sync'}
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-2">
        {isLoading && (
          <div className="space-y-2 p-2 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 bg-[var(--bg-secondary)] rounded" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-red-400 p-2">
            {error instanceof Error ? error.message : 'Failed to load branches'}
          </p>
        )}

        {!isLoading && !isError && branches.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] p-2 leading-relaxed">
            No branches synced. Click Sync after importing commits.
          </p>
        )}

        {!isLoading && branches.length > 0 && (
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onSelectBranch(null)}
                className={branchButtonClass(selectedBranchName === null)}
              >
                <span className="truncate">All commits</span>
              </button>
            </li>
            {branches.map((branch) => {
              const isActive = branch.isDefault || branch.name === activeBranch;
              const isSelected = selectedBranchName === branch.name;

              return (
                <li key={branch.id}>
                  <button
                    type="button"
                    onClick={() => onSelectBranch(branch.name)}
                    className={branchButtonClass(isSelected)}
                  >
                    <span className="truncate flex-1 text-left">{branch.name}</span>
                    {isActive && (
                      <span className="text-[9px] uppercase tracking-wide text-emerald-400/90 shrink-0">
                        active
                      </span>
                    )}
                  </button>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] px-3 pb-1">
                    {branch.commitCount} commits
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

function branchButtonClass(selected: boolean): string {
  return [
    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors',
    selected
      ? 'bg-blue-950/40 text-blue-300 border border-blue-800/40'
      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] border border-transparent',
  ].join(' ');
}
