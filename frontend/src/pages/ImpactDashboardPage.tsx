import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositoryWorkspace } from '../context/RepositoryContext';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts';
import { CommitGraph } from '../components/CommitGraph';
import { useRepositoryGraph } from '../hooks/useCommits';
import { useImpactAnalysis } from '../hooks/useAdvanced';

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(59, 130, 246, 0.25)',
  borderRadius: '8px',
  color: '#e2e8f0',
};

const TOP_LIMITS = [10, 25, 50] as const;

const ImpactDashboardPage: React.FC = () => {
  const { repositoryId } = useRepositoryWorkspace();
  const navigate = useNavigate();
  const [limit, setLimit] = useState<number>(25);
  const [contributor, setContributor] = useState('');
  const [minScore, setMinScore] = useState('');

  const { data: impact, isLoading, isError, error } = useImpactAnalysis(repositoryId, {
    limit,
    contributor: contributor || undefined,
    minScore: minScore ? Number.parseFloat(minScore) : undefined,
  });
  const { data: graph } = useRepositoryGraph(repositoryId, !!repositoryId);

  const scatterData = useMemo(
    () =>
      (impact?.topCommits ?? []).map((c) => ({
        size: c.additions + c.deletions,
        score: c.impactScore,
        hash: c.hash,
        message: c.message.slice(0, 30),
      })),
    [impact]
  );

  const timelineData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const c of impact?.topCommits ?? []) {
      const d = new Date(c.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + c.impactScore);
    }
    return Array.from(buckets.entries())
      .map(([period, score]) => ({ period, score }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [impact]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] mb-4">Impact</h2>

        <div className="flex flex-wrap gap-2">
          {TOP_LIMITS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLimit(n)}
              className={limit === n ? 'btn-primary text-xs' : 'btn-ghost text-xs'}
            >
              Top {n}
            </button>
          ))}
          <input
            className="input-field text-xs max-w-[160px]"
            placeholder="Filter contributor"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
          />
          <input
            className="input-field text-xs max-w-[120px]"
            placeholder="Min score"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
        </div>

        {isLoading && <p className="text-sm text-[var(--text-muted)] mt-6">Analyzing impact…</p>}
        {isError && (
          <p className="text-sm text-red-400 mt-6">
            {error instanceof Error ? error.message : 'Impact analysis failed'}
          </p>
        )}

        {impact && (
          <>
            <div className="grid md:grid-cols-3 gap-3 mt-6">
              {impact.insights.mostImpactfulContributor && (
                <InsightCard
                  label="Top contributor"
                  value={impact.insights.mostImpactfulContributor.name}
                  sub={`Impact ${impact.insights.mostImpactfulContributor.totalImpact}`}
                />
              )}
              {impact.insights.mostImpactfulBranch && (
                <InsightCard
                  label="Top branch"
                  value={impact.insights.mostImpactfulBranch.name}
                  sub={`Score ${impact.insights.mostImpactfulBranch.score}`}
                />
              )}
              {impact.insights.largestCommit && (
                <InsightCard
                  label="Largest commit"
                  value={impact.insights.largestCommit.hash.slice(0, 7)}
                  sub={impact.insights.largestCommit.message.slice(0, 40)}
                />
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-8">
              <div className="card p-4">
                <h3 className="text-sm font-semibold mb-3">Impact scores</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={impact.topCommits.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                    <XAxis dataKey="hash" tick={{ fontSize: 8 }} tickFormatter={(h) => h.slice(0, 6)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="impactScore" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-4">
                <h3 className="text-sm font-semibold mb-3">Impact over time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                    <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold mb-3">Impact vs commit size</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                    <XAxis dataKey="size" name="Lines changed" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="score" name="Impact" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={scatterData} fill="#a855f7" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card mt-8 overflow-hidden">
              <ul className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                {impact.topCommits.map((c, i) => (
                  <li key={c.hash}>
                    <button
                      type="button"
                      className="w-full px-5 py-3 text-left hover:bg-blue-950/20 flex items-center gap-4"
                      onClick={() =>
                        navigate(`/repositories/${repositoryId}/graph?commit=${c.hash}`)
                      }
                    >
                      <span className="text-xs font-mono text-[var(--text-muted)] w-6">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{c.message}</p>
                        <p className="text-xs text-[var(--text-muted)]">{c.author}</p>
                      </div>
                      <span className="font-mono text-sm text-blue-400">★{c.impactScore}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {graph && (
              <div className="mt-8 h-[420px] min-h-[420px]">
                <h3 className="text-sm font-semibold mb-3">Graph (impact sizing)</h3>
                <CommitGraph
                  graph={graph}
                  selectedCommitHash={null}
                  focusCommitHash={null}
                  onSelectCommit={() => {}}
                  skipFitView
                  impactScores={impact.scoreByHash}
                />
              </div>
            )}
          </>
        )}
    </div>
  );
};

const InsightCard: React.FC<{ label: string; value: string; sub: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="card p-4">
    <p className="text-xs text-[var(--text-muted)]">{label}</p>
    <p className="font-semibold text-[var(--text-primary)] mt-1 truncate">{value}</p>
    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{sub}</p>
  </div>
);

export default ImpactDashboardPage;
