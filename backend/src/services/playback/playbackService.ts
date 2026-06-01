import prisma from '../../utils/prisma';
import { graphService } from '../graph/graphServiceInstance';
import {
  PlaybackGraphState,
  PlaybackTimeline,
  PlaybackTimelineEntry,
  PlaybackDateFilter,
} from '../../types';

const MAX_FRAMES = 800;

export class PlaybackService {
  async getPlayback(
    repositoryId: string,
    dateFilter: PlaybackDateFilter = 'all'
  ): Promise<PlaybackTimeline> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    let commits = await prisma.commit.findMany({
      where: { repositoryId },
      select: {
        hash: true,
        parentHashes: true,
        commitDate: true,
      },
      orderBy: { commitDate: 'asc' },
    });

    commits = this.applyDateFilter(commits, dateFilter);

    if (commits.length === 0) {
      return { repositoryId, baseGraph: { nodes: [], edges: [], activeBranch: null }, timeline: [] };
    }

    const fullGraph = await graphService.buildGraph(repositoryId);
    const nodeById = new Map(fullGraph.nodes.map((n) => [n.id, n]));
    const allEdges = fullGraph.edges;

    const visible = new Set<string>();
    const timeline: PlaybackTimelineEntry[] = [];

    const step = commits.length > MAX_FRAMES ? Math.ceil(commits.length / MAX_FRAMES) : 1;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      visible.add(commit.hash);

      const isFrame = i === commits.length - 1 || i % step === 0;
      if (!isFrame) continue;

      const visibleNodes = Array.from(visible)
        .map((id) => nodeById.get(id))
        .filter((n): n is NonNullable<typeof n> => !!n);

      const visibleIds = new Set(visible);
      const visibleEdges = allEdges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
      );

      const graphState: PlaybackGraphState = {
        nodes: visibleNodes,
        edges: visibleEdges,
      };

      timeline.push({
        timestamp: commit.commitDate.toISOString(),
        commitHash: commit.hash,
        graphState,
      });
    }

    return {
      repositoryId,
      baseGraph: fullGraph,
      timeline,
    };
  }

  private applyDateFilter(
    commits: { hash: string; parentHashes: string[]; commitDate: Date }[],
    filter: PlaybackDateFilter
  ) {
    if (filter === 'all' || commits.length === 0) return commits;

    const now = new Date();
    let cutoff = new Date(0);

    if (filter === '1y') {
      cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
    } else if (filter === '6m') {
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
    } else if (filter === 'custom') {
      return commits;
    }

    return commits.filter((c) => c.commitDate >= cutoff);
  }
}
