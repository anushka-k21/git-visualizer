import React from 'react';
import { Outlet } from 'react-router-dom';
import { RepositoryProvider, useRepositoryWorkspace } from '../context/RepositoryContext';
import { RepositoryBreadcrumbs } from '../components/repository/RepositoryBreadcrumbs';
import { RepositoryHeader } from '../components/repository/RepositoryHeader';
import { RepositoryNavigation } from '../components/repository/RepositoryNavigation';
import { Link } from 'react-router-dom';

function RepositoryLayoutContent() {
  const { isError, error, repository, isLoading } = useRepositoryWorkspace();

  if (isError && !repository) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-8">
        <h2 className="font-display font-semibold text-[var(--text-primary)] mb-2">
          Repository not found
        </h2>
        <p className="text-sm text-red-400 mb-4">
          {error instanceof Error ? error.message : 'Failed to load repository'}
        </p>
        <Link to="/repositories" className="btn-primary inline-flex">
          Back to repositories
        </Link>
      </div>
    );
  }

  if (isLoading && !repository) {
    return (
      <div className="card p-12 flex items-center justify-center min-h-[320px] animate-pulse">
        <p className="text-sm font-mono text-[var(--text-muted)]">Loading repository…</p>
      </div>
    );
  }

  return (
    <>
      <RepositoryBreadcrumbs />
      <RepositoryHeader />
      <RepositoryNavigation />
      <Outlet />
    </>
  );
}

export const RepositoryLayout: React.FC = () => (
  <RepositoryProvider>
    <div className="min-h-[calc(100vh-56px)] relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
        <RepositoryLayoutContent />
      </div>
    </div>
  </RepositoryProvider>
);

export default RepositoryLayout;
