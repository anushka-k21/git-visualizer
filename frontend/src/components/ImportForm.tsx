import React, { useState } from 'react';
import { useImportRepository } from '../hooks/useRepositories';
import { ImportStatus, ApiResponse, Repository } from '../types';

interface ImportFormProps {
  onSuccess?: () => void;
}

export const ImportForm: React.FC<ImportFormProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [resultMessage, setResultMessage] = useState('');

  const { mutate: importRepo } = useImportRepository();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || status === 'loading') return;

    setStatus('loading');
    setResultMessage('');

    importRepo(
      { url: url.trim() },
      {
        onSuccess: (data: ApiResponse<Repository>) => {
          setStatus('success');
          setResultMessage(data.message ?? 'Repository imported successfully!');
          setUrl('');
          onSuccess?.();
        },
        onError: (error: unknown) => {
          setStatus('error');
          setResultMessage(error instanceof Error ? error.message : 'Import failed.');
        },
      }
    );
  };

  const handleReset = () => {
    setStatus('idle');
    setResultMessage('');
  };

  const isLoading = status === 'loading';

  return (
    <div className="animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repo-url" className="label">
            Repository URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <GitIcon />
            </div>
            <input
              id="repo-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status !== 'idle') handleReset();
              }}
              placeholder="https://github.com/owner/repository"
              className="input-field pl-10"
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn-primary w-full justify-center py-3"
        >
          {isLoading ? (
            <>
              <SpinnerIcon />
              <span>Cloning repository…</span>
            </>
          ) : (
            <>
              <DownloadIcon />
              <span>Import Repository</span>
            </>
          )}
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-4 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 animate-slide-up">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-medium text-emerald-300">Import successful</p>
              <p className="text-xs text-emerald-500/80 mt-0.5 font-mono">{resultMessage}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-4 rounded-lg bg-red-950/40 border border-red-800/50 animate-slide-up">
          <div className="flex items-start gap-3">
            <XCircleIcon className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-medium text-red-300">Import failed</p>
              <p className="text-xs text-red-500/80 mt-0.5 font-mono">{resultMessage}</p>
              <button
                onClick={handleReset}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 p-4 rounded-lg bg-blue-950/20 border border-blue-800/30 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-xs font-mono text-blue-400/70">
              Cloning repository — this may take a moment…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const GitIcon = () => (
  <svg className="w-4 h-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 21V9a9 9 0 0 0 9 9" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-5 h-5 ${className ?? ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-5 h-5 ${className ?? ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
