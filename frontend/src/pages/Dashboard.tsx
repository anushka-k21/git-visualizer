import React from 'react';
import { Link } from 'react-router-dom';
import { ImportForm } from '../components/ImportForm';
import { useRepositories } from '../hooks/useRepositories';

const Dashboard: React.FC = () => {
  const { data: repositories } = useRepositories();
  const repoCount = repositories?.length ?? 0;

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-lg space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-mono text-blue-400/80 tracking-widest uppercase">
                GitScope
              </span>
            </div>

            <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)] tracking-tight">
              Import a Repository
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-body leading-relaxed">
              Paste a public GitHub, GitLab, or Bitbucket URL to clone and explore commit history,
              branches, insights, and more.
            </p>
          </div>

          <div className="card p-6 shadow-2xl shadow-blue-950/20" style={{ borderColor: 'var(--border-bright)' }}>
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] ml-1">git clone</span>
            </div>

            <ImportForm />
          </div>

          {repoCount > 0 && (
            <div className="text-center animate-fade-in">
              <Link
                to="/repositories"
                className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
              >
                <span>
                  View {repoCount} imported {repoCount === 1 ? 'repository' : 'repositories'}
                </span>
                <ArrowIcon className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-3.5 h-3.5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default Dashboard;
