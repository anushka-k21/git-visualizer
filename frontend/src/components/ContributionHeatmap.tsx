import React, { memo, useMemo, useState } from 'react';
import { HeatmapEntry, HeatmapRange } from '../types';

const RANGE_OPTIONS: { value: HeatmapRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
  { value: 'all', label: 'All time' },
];

const LEVELS = [
  'bg-[var(--bg-secondary)]',
  'bg-blue-900/50',
  'bg-blue-700/60',
  'bg-blue-600/70',
  'bg-blue-500/90',
];

function levelForCount(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

interface ContributionHeatmapProps {
  entries: HeatmapEntry[];
  loading?: boolean;
  range: HeatmapRange;
  onRangeChange: (range: HeatmapRange) => void;
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = memo(
  ({ entries, loading, range, onRangeChange }) => {
    const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(
      null
    );

    const { weeks, maxCount } = useMemo(() => {
      if (entries.length === 0) {
        return { weeks: [] as { date: string; count: number }[][], maxCount: 0 };
      }

      const byDate = new Map(entries.map((e) => [e.date, e.commitCount]));
      const start = new Date(`${entries[0].date}T00:00:00.000Z`);
      const end = new Date(`${entries[entries.length - 1].date}T00:00:00.000Z`);

      const startDow = start.getUTCDay();
      const gridStart = new Date(start);
      gridStart.setUTCDate(gridStart.getUTCDate() - startDow);

      const result: { date: string; count: number }[][] = [];
      let cursor = new Date(gridStart);
      let max = 0;

      while (cursor <= end || result.length === 0) {
        const week: { date: string; count: number }[] = [];
        for (let d = 0; d < 7; d++) {
          const y = cursor.getUTCFullYear();
          const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
          const day = String(cursor.getUTCDate()).padStart(2, '0');
          const key = `${y}-${m}-${day}`;
          const count = byDate.get(key) ?? 0;
          if (count > max) max = count;
          week.push({ date: key, count });
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        result.push(week);
        if (cursor > end && result.length > 1) break;
        if (result.length > 60) break;
      }

      return { weeks: result, maxCount: max };
    }, [entries]);

    if (loading) {
      return <div className="card h-40 animate-pulse" />;
    }

    return (
      <div className="card p-5 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-display font-semibold text-[var(--text-primary)]">
            Contribution activity
          </h3>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onRangeChange(opt.value)}
                className={[
                  'px-2.5 py-1 text-[10px] font-mono transition-colors',
                  range === opt.value
                    ? 'bg-blue-950/50 text-blue-300'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No commit activity for this range.</p>
        ) : (
          <div className="relative">
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const level = levelForCount(day.count, maxCount);
                    return (
                      <div
                        key={day.date}
                        className={`w-3 h-3 rounded-sm ${LEVELS[level]} border border-transparent hover:border-blue-400/50 transition-colors`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            date: day.date,
                            count: day.count,
                            x: rect.left,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {tooltip && (
              <div
                className="fixed z-50 px-2 py-1 rounded text-xs font-mono pointer-events-none border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-lg"
                style={{ left: tooltip.x, top: tooltip.y - 36 }}
              >
                <div>{tooltip.count} commits</div>
                <div className="text-[var(--text-muted)]">{tooltip.date}</div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 text-[10px] text-[var(--text-muted)] font-mono">
              <span>Less</span>
              {LEVELS.map((cls, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ContributionHeatmap.displayName = 'ContributionHeatmap';
