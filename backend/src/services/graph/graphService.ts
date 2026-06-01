import prisma from '../../utils/prisma';
import { GraphResponse } from '../../types';
import { computeLayout, LayoutBranchMeta } from './layoutEngine';

interface GraphCacheEntry {
  commitCount: number;
  branchCount: number;
  latestCommitAt: string;
  graph: GraphResponse;
}

export class GraphService {
  private cache = new Map<string, GraphCacheEntry>();

  invalidate(repositoryId: string): void {
    this.cache.delete(repositoryId);
  }

  private buildBranchMeta(
    branches: { name: string; headCommitHash: string; isDefault: boolean }[]
  ): { meta: LayoutBranchMeta; activeBranch: string | null } {
    const headHashes = new Set<string>();
    const namesByHead = new Map<string, string[]>();
    let activeBranch: string | null = null;

    for (const branch of branches) {
      headHashes.add(branch.headCommitHash);
      const names = namesByHead.get(branch.headCommitHash) ?? [];
      names.push(branch.name);
      namesByHead.set(branch.headCommitHash, names);
      if (branch.isDefault) {
        activeBranch = branch.name;
      }
    }

    return {
      meta: { headHashes, namesByHead },
      activeBranch,
    };
  }

  async buildGraph(repositoryId: string): Promise<GraphResponse> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const [commits, branches] = await Promise.all([
      prisma.commit.findMany({
        where: { repositoryId },
        select: {
          hash: true,
          parentHashes: true,
          author: true,
          message: true,
          commitDate: true,
        },
      }),
      prisma.branch.findMany({
        where: { repositoryId },
        select: { name: true, headCommitHash: true, isDefault: true },
      }),
    ]);

    if (commits.length === 0) {
      return { nodes: [], edges: [], activeBranch: null };
    }

    const latestCommitAt = commits
      .reduce((max, c) => (c.commitDate > max ? c.commitDate : max), commits[0].commitDate)
      .toISOString();

    const cached = this.cache.get(repositoryId);
    if (
      cached &&
      cached.commitCount === commits.length &&
      cached.branchCount === branches.length &&
      cached.latestCommitAt === latestCommitAt
    ) {
      return cached.graph;
    }

    const { meta, activeBranch } = this.buildBranchMeta(branches);

    const layout = computeLayout(
      commits.map((c) => ({
        hash: c.hash,
        parentHashes: c.parentHashes,
        author: c.author,
        message: c.message,
        commitDate: c.commitDate,
      })),
      meta
    );

    const graph: GraphResponse = {
      ...layout,
      activeBranch,
    };

    this.cache.set(repositoryId, {
      commitCount: commits.length,
      branchCount: branches.length,
      latestCommitAt,
      graph,
    });

    return graph;
  }
}
