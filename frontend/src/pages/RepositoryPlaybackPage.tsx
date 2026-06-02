import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommitGraph } from '../components/CommitGraph';
import { useRepositoryWorkspace } from '../context/RepositoryContext';
import { usePlayback } from '../hooks/useAdvanced';
import { GraphResponse, PlaybackDateFilter } from '../types';

const SPEEDS = [0.5, 1, 2, 5, 10] as const;

const RepositoryPlaybackPage: React.FC = () => {
  const { repositoryId } = useRepositoryWorkspace();
  const [filter, setFilter] = useState<PlaybackDateFilter>('all');
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<number | null>(null);

  const { data: playback, isLoading, isError, error } = usePlayback(repositoryId, filter);

  const timeline = playback?.timeline ?? [];
  const currentFrame = timeline[frameIndex];

  const displayGraph: GraphResponse | undefined = useMemo(() => {
    if (!currentFrame) return undefined;
    return {
      nodes: currentFrame.graphState.nodes,
      edges: currentFrame.graphState.edges,
      activeBranch: playback?.baseGraph.activeBranch ?? null,
    };
  }, [currentFrame, playback?.baseGraph.activeBranch]);

  const tick = useCallback(() => {
    setFrameIndex((i) => {
      if (i >= timeline.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [timeline.length]);

  useEffect(() => {
    if (!playing || timeline.length === 0) return;
    const ms = 1000 / speed;
    timerRef.current = window.setInterval(tick, ms);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, speed, tick, timeline.length]);

  const stop = () => {
    setPlaying(false);
    setFrameIndex(0);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] mb-4">Playback</h2>

        <div className="flex flex-wrap gap-2">
          {(['all', '1y', '6m'] as PlaybackDateFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setFrameIndex(0);
                setPlaying(false);
              }}
              className={filter === f ? 'btn-primary text-xs' : 'btn-ghost text-xs'}
            >
              {f === 'all' ? 'All time' : f === '1y' ? 'Last year' : 'Last 6 months'}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-[var(--text-muted)] mt-6">Loading playback…</p>}
        {isError && (
          <p className="text-sm text-red-400 mt-6">
            {error instanceof Error ? error.message : 'Playback failed'}
          </p>
        )}

        {timeline.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 mt-6 card p-4">
              <button type="button" className="btn-primary text-xs" onClick={() => setPlaying(true)}>
                Play
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={() => setPlaying(false)}>
                Pause
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={stop}>
                Stop
              </button>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="input-field text-xs py-1"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}x
                  </option>
                ))}
              </select>
              <span className="text-xs font-mono text-[var(--text-muted)] ml-auto">
                Frame {frameIndex + 1} / {timeline.length}
                {currentFrame && ` · ${currentFrame.commitHash.slice(0, 7)}`}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(0, timeline.length - 1)}
              value={frameIndex}
              onChange={(e) => {
                setPlaying(false);
                setFrameIndex(Number(e.target.value));
              }}
              className="w-full mt-4"
            />

            <div className="mt-6 min-h-[480px]" style={{ height: 'calc(100vh - 320px)' }}>
              {displayGraph && (
                <CommitGraph
                  graph={displayGraph}
                  selectedCommitHash={currentFrame?.commitHash ?? null}
                  focusCommitHash={currentFrame?.commitHash ?? null}
                  onSelectCommit={() => {}}
                  skipFitView={frameIndex > 0}
                />
              )}
            </div>
          </>
        )}

        {!isLoading && timeline.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] mt-6">Sync commits to enable playback.</p>
        )}
    </div>
  );
};

export default RepositoryPlaybackPage;
