import React, { useState } from 'react';
import { useCommitDetails } from '../hooks/useCommits';
import { useCommitDiff } from '../hooks/useAdvanced';
import { DiffViewer } from './DiffViewer';
import { formatDate } from '../utils';

interface CommitDetailsPanelProps {
  repositoryId: string;
  commitHash: string | null;
}

type Tab = 'details' | 'diff';

export const CommitDetailsPanel: React.FC<CommitDetailsPanelProps> = ({
  repositoryId,
  commitHash,
}) => {
  const [tab, setTab] = useState<Tab>('details');
  const { data, isLoading, isError, error } = useCommitDetails(repositoryId, commitHash);
  const {
    data: diff,
    isLoading: diffLoading,
    isError: diffError,
    error: diffErr,
  } = useCommitDiff(repositoryId, commitHash, undefined, tab === 'diff' && !!commitHash);

  if (!commitHash) {
    return (
      <aside className="card w-full lg:w-96 xl:w-[28rem] shrink-0 flex flex-col max-h-[calc(100vh-220px)]">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">Commit</h2>
        </div>
        <div className="p-5 flex-1 flex items-center justify-center">
          <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
            Select a commit on the graph to view details and diff.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="card w-full lg:w-96 xl:w-[28rem] shrink-0 flex flex-col max-h-[calc(100vh-220px)]">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">Commit</h2>
        <p className="font-mono text-xs text-blue-400/90 mt-1 truncate">{commitHash}</p>
        <div className="flex mt-3 rounded-lg border border-[var(--border)] overflow-hidden">
          {(['details', 'diff'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-1.5 text-xs font-mono capitalize',
                tab === t ? 'bg-blue-950/50 text-blue-300' : 'text-[var(--text-muted)]',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'details' ? (
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-3 bg-[var(--bg-secondary)] rounded w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-red-400">
              {error instanceof Error ? error.message : 'Failed to load commit details'}
            </p>
          )}
          {data && !isLoading && (
            <>
              <DetailSection label="Message">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {data.message}
                </p>
              </DetailSection>
              <DetailSection label="Author">
                <p className="text-sm text-[var(--text-primary)]">{data.author}</p>
                <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{data.email}</p>
              </DetailSection>
              <DetailSection label="Date">
                <p className="text-sm text-[var(--text-secondary)]">{formatDate(data.commitDate)}</p>
              </DetailSection>
              <DetailSection label="Merge commit">
                <p className="text-sm text-[var(--text-primary)]">
                  {data.isMergeCommit ? 'Yes' : 'No'}
                </p>
              </DetailSection>
              {data.isMergeCommit && data.parentHashes.length > 0 && (
                <DetailSection label="Parents">
                  <ul className="space-y-1">
                    {data.parentHashes.map((parent) => (
                      <li key={parent} className="font-mono text-xs text-[var(--text-muted)] truncate">
                        {parent}
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              )}
              <DetailSection label="Changes">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <StatBadge label="Files" value={data.filesChanged} />
                  <StatBadge label="+" value={data.additions} className="text-emerald-400" />
                  <StatBadge label="−" value={data.deletions} className="text-red-400" />
                </div>
              </DetailSection>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <DiffViewer
            diff={diff}
            isLoading={diffLoading}
            isError={diffError}
            error={diffErr}
          />
        </div>
      )}
    </aside>
  );
};

const DetailSection: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
      {label}
    </h3>
    {children}
  </div>
);

const StatBadge: React.FC<{ label: string; value: number; className?: string }> = ({
  label,
  value,
  className = 'text-[var(--text-primary)]',
}) => (
  <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] py-2 px-1">
    <div className={`text-sm font-semibold font-mono ${className}`}>{value}</div>
    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</div>
  </div>
);
