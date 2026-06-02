import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Standard back control for repository workspace pages — always returns to the list.
 */
export const RepositoryBackLink: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Link
    to="/repositories"
    className={[
      'inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]',
      'hover:text-[var(--text-secondary)] transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded px-1 py-0.5',
      className,
    ].join(' ')}
    aria-label="Back to repositories list"
  >
    <span aria-hidden>←</span>
    <span>Repositories</span>
  </Link>
);
