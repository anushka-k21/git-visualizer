import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  repositoryCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ repositoryCount }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Import' },
    { path: '/repositories', label: 'Repositories' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <BranchIcon />
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text-primary)] tracking-tight">
            Git<span className="text-blue-400">Scope</span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/repositories'
                ? location.pathname === '/repositories' ||
                  /^\/repositories\/[^/]+/.test(location.pathname)
                : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-display font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }
                `}
              >
                {item.label}
                {item.path === '/repositories' && repositoryCount !== undefined && (
                  <span className={`
                    ml-1.5 px-1.5 py-0.5 rounded text-xs font-mono
                    ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}
                  `}>
                    {repositoryCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

const BranchIcon = () => (
  <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);
