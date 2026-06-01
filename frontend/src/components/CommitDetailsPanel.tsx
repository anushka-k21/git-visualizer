import React from 'react';
import { useCommitDetails } from '../hooks/useCommits';
import { formatDate } from '../utils';

interface CommitDetailsPanelProps {
  repositoryId: string;
  commitHash: string | null;
}

export const CommitDetailsPanel: React.FC<CommitDetailsPanelProps> = ({
  repositoryId,
  commitHash,
}) => {
  const { data, isLoading, isError, error } = useCommitDetails(repositoryId, commitHash);

  if (!commitHash) {
    return (
      <aside className="card w-full lg:w-80 shrink-0 flex flex-col max-h-[calc(100vh-220px)]">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">
            Commit details
          </h2>
        </div>
        <div className="p-5 flex-1 flex items-center justify-center">
          <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
            Select a commit on the graph to view details.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="card w-full lg:w-80 shrink-0 flex flex-col max-h-[calc(100vh-220px)]">
      <div className="p-5 border-b border-[var(--border)]">
        <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">
          Commit details
        </h2>
        <p className="font-mono text-xs text-blue-400/90 mt-1 truncate">{commitHash}</p>
      </div>

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

            {!data.isMergeCommit && data.parentHashes.length > 0 && (
              <DetailSection label="Parent">
                <p className="font-mono text-xs text-[var(--text-muted)] truncate">
                  {data.parentHashes[0]}
                </p>
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
