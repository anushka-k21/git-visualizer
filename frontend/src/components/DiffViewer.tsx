import React, { memo, useMemo, useState } from 'react';
import { CommitDiff, DiffFile } from '../types';

type ViewMode = 'unified' | 'split';

interface DiffViewerProps {
  diff: CommitDiff | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  lazyFileLimit?: number;
}

const PatchLines = memo(function PatchLines({
  patch,
  mode,
}: {
  patch: string;
  mode: ViewMode;
}) {
  const lines = useMemo(() => patch.split('\n'), [patch]);

  const split = useMemo(() => {
    const l: string[] = [];
    const r: string[] = [];
    for (const line of lines) {
      if (line.startsWith('-') && !line.startsWith('---')) {
        l.push(line.slice(1));
        r.push('');
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        l.push('');
        r.push(line.slice(1));
      } else if (line.startsWith('@@')) {
        l.push(line);
        r.push(line);
      } else {
        const ctx = line.startsWith(' ') ? line.slice(1) : line;
        l.push(ctx);
        r.push(ctx);
      }
    }
    return { left: l, right: r };
  }, [lines]);

  if (mode === 'unified') {
    return (
      <pre className="text-xs font-mono leading-5 overflow-x-auto">
        {lines.map((line, i) => {
          let cls = 'text-[var(--text-secondary)]';
          if (line.startsWith('+') && !line.startsWith('+++')) cls = 'bg-emerald-950/40 text-emerald-300';
          else if (line.startsWith('-') && !line.startsWith('---'))
            cls = 'bg-red-950/40 text-red-300';
          else if (line.startsWith('@@')) cls = 'text-blue-400/80';
          return (
            <div key={i} className={`px-2 ${cls}`}>
              {line || ' '}
            </div>
          );
        })}
      </pre>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
      <pre className="text-xs font-mono leading-5 overflow-x-auto bg-[var(--bg-primary)] p-2">
        {split.left.map((line, i) => (
          <div key={i} className="text-red-300/90 min-h-[1.25rem]">
            {line || ' '}
          </div>
        ))}
      </pre>
      <pre className="text-xs font-mono leading-5 overflow-x-auto bg-[var(--bg-primary)] p-2">
        {split.right.map((line, i) => (
          <div key={i} className="text-emerald-300/90 min-h-[1.25rem]">
            {line || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
});

const FileSection = memo(function FileSection({
  file,
  mode,
  defaultOpen,
}: {
  file: DiffFile;
  mode: ViewMode;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--bg-secondary)] text-left hover:bg-[var(--bg-secondary)]/80"
      >
        <span className="font-mono text-xs text-[var(--text-primary)] truncate">{file.path}</span>
        <span className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
          <span className="text-emerald-400">+{file.additions}</span>
          <span className="text-red-400">−{file.deletions}</span>
          <span className="badge">{file.status}</span>
          <span>{open ? '▼' : '▶'}</span>
        </span>
      </button>
      {open && (
        <div className="max-h-80 overflow-auto">
          {file.status === 'binary' || !file.patch ? (
            <p className="p-3 text-xs text-[var(--text-muted)]">Binary or large file — no patch preview.</p>
          ) : (
            <PatchLines patch={file.patch} mode={mode} />
          )}
        </div>
      )}
    </div>
  );
});

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  isLoading,
  isError,
  error,
  lazyFileLimit = 15,
}) => {
  const [mode, setMode] = useState<ViewMode>('unified');
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 bg-[var(--bg-secondary)] rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="p-4 text-sm text-red-400">
        {error instanceof Error ? error.message : 'Failed to load diff'}
      </p>
    );
  }

  if (!diff || diff.files.length === 0) {
    return <p className="p-4 text-sm text-[var(--text-muted)]">No file changes in this commit.</p>;
  }

  const visibleFiles = showAll ? diff.files : diff.files.slice(0, lazyFileLimit);
  const totalAdd = diff.files.reduce((s, f) => s + f.additions, 0);
  const totalDel = diff.files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="text-xs font-mono text-[var(--text-muted)]">
          {diff.files.length} files · <span className="text-emerald-400">+{totalAdd}</span>{' '}
          <span className="text-red-400">−{totalDel}</span>
        </div>
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          {(['unified', 'split'] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={[
                'px-2 py-1 text-[10px] font-mono capitalize',
                mode === m ? 'bg-blue-950/50 text-blue-300' : 'text-[var(--text-muted)]',
              ].join(' ')}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {visibleFiles.map((file, i) => (
          <FileSection key={file.path} file={file} mode={mode} defaultOpen={i < 3} />
        ))}
        {!showAll && diff.files.length > lazyFileLimit && (
          <button type="button" onClick={() => setShowAll(true)} className="btn-ghost w-full text-xs">
            Show all {diff.files.length} files
          </button>
        )}
      </div>
    </div>
  );
};
