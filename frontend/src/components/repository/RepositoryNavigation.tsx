import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

const NAV_ITEMS = [
  { segment: 'graph', label: 'Graph' },
  { segment: 'timeline', label: 'Timeline' },
  { segment: 'files', label: 'Files' },
  { segment: 'insights', label: 'Insights' },
  { segment: 'compare', label: 'Compare' },
  { segment: 'playback', label: 'Playback' },
  { segment: 'impact', label: 'Impact' },
] as const;

export const RepositoryNavigation: React.FC = () => {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const base = `/repositories/${repositoryId}`;

  return (
    <nav
      className="mb-6 -mx-1"
      aria-label="Repository sections"
    >
      {/* Desktop / tablet: scrollable tabs */}
      <div className="hidden sm:flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.segment}
            to={`${base}/${item.segment}`}
            className={({ isActive }) =>
              [
                'shrink-0 px-3 py-2 rounded-lg text-xs font-display font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                isActive
                  ? 'bg-blue-950/50 text-blue-300 border border-blue-800/40'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] border border-transparent',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Mobile: same scrollable row with smaller padding */}
      <div className="flex sm:hidden gap-1 overflow-x-auto pb-2 -mx-4 px-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.segment}
            to={`${base}/${item.segment}`}
            className={({ isActive }) =>
              [
                'shrink-0 px-2.5 py-1.5 rounded-md text-[11px] font-display font-medium whitespace-nowrap',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                isActive
                  ? 'bg-blue-950/50 text-blue-300 border border-blue-800/40'
                  : 'text-[var(--text-muted)] border border-transparent',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
