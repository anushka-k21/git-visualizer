import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Repository } from '../types';
import { formatRelativeTime, getInitials, stringToHue } from '../utils';
import { useDeleteRepository } from '../hooks/useRepositories';

interface RepositoryCardProps {
  repository: Repository;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteRepo } = useDeleteRepository();

  const hue = stringToHue(repository.name);
  const initials = getInitials(repository.name);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    deleteRepo(repository.id, {
      onError: () => {
        setIsDeleting(false);
        setConfirmDelete(false);
      },
    });
  };

  return (
    <div className="card card-hover p-5 group animate-slide-up">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 font-mono font-semibold text-sm border"
          style={{
            background: `hsl(${hue}, 60%, 12%)`,
            borderColor: `hsl(${hue}, 50%, 22%)`,
            color: `hsl(${hue}, 80%, 70%)`,
          }}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-[var(--text-primary)] text-sm truncate">
                {repository.owner}
                <span className="text-[var(--text-muted)] mx-1">/</span>
                {repository.name}
              </h3>
              <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5 truncate">
                {repository.url}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Link
                to={`/repositories/${repository.id}/insights`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Insights
              </Link>
              <Link
                to={`/repositories/${repository.id}/graph`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Graph
              </Link>
              <Link
                to={`/repositories/${repository.id}/timeline`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Timeline
              </Link>
              <Link
                to={`/repositories/${repository.id}/files`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Files
              </Link>
              <Link
                to={`/repositories/${repository.id}/compare`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Compare
              </Link>
              <Link
                to={`/repositories/${repository.id}/playback`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Playback
              </Link>
              <Link
                to={`/repositories/${repository.id}/impact`}
                className="btn-ghost text-xs px-2 py-1"
              >
                Impact
              </Link>
              {confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-ghost text-xs px-2 py-1"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={[
                  'btn-ghost text-xs px-2 py-1',
                  confirmDelete ? 'text-red-400 hover:text-red-300 hover:bg-red-950/30' : '',
                  isDeleting ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
                title={confirmDelete ? 'Click again to confirm' : 'Delete repository'}
              >
                {isDeleting ? <SpinIcon /> : confirmDelete ? 'Confirm' : <TrashIcon />}
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-3">
            <span
              className="badge"
              style={{
                background: `hsl(${hue}, 60%, 10%)`,
                border: '1px solid',
                borderColor: `hsl(${hue}, 50%, 18%)`,
                color: `hsl(${hue}, 70%, 65%)`,
              }}
            >
              <FolderIcon />
              {repository.name}
            </span>

            <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <ClockIcon />
              {formatRelativeTime(repository.createdAt)}
            </span>
          </div>

          {/* Local path */}
          <div className="mt-2 flex items-center gap-1.5">
            <PathIcon />
            <code className="text-xs font-mono text-[var(--text-muted)] truncate">
              {repository.localPath}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

const FolderIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PathIcon = () => (
  <svg className="w-3 h-3 text-[var(--text-muted)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const SpinIcon = () => (
  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
