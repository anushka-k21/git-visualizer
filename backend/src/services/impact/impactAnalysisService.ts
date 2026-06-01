import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import {
  calculateImpactScores,
  getTopImpactCommits,
  ImpactCommitInput,
} from '../../utils/impactCalculator';
import { parseNumstatOutput } from '../../utils/commitShowParser';
import { ImpactAnalysisResponse, ImpactInsights } from '../../types';

interface ImpactCacheEntry {
  commitCount: number;
  branchCount: number;
  scores: ReturnType<typeof calculateImpactScores>;
  computedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;

export class ImpactAnalysisService {
  private cache = new Map<string, ImpactCacheEntry>();
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  invalidate(repositoryId: string): void {
    this.cache.delete(repositoryId);
  }

  /**
   * Compute on demand with in-memory cache (Option B).
   * Scales without schema migrations; recomputes when commit/branch counts change.
   */
  async getImpact(
    repositoryId: string,
    limit = 50,
    options: {
      contributor?: string;
      branch?: string;
      minScore?: number;
      fromDate?: string;
      toDate?: string;
    } = {}
  ): Promise<ImpactAnalysisResponse> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const [commits, branches, branchCount] = await Promise.all([
      prisma.commit.findMany({
        where: { repositoryId },
        select: {
          hash: true,
          author: true,
          email: true,
          message: true,
          commitDate: true,
          parentHashes: true,
        },
      }),
      prisma.branch.findMany({
        where: { repositoryId },
        select: { name: true, headCommitHash: true },
      }),
      prisma.branch.count({ where: { repositoryId } }),
    ]);

    const cached = this.cache.get(repositoryId);
    const now = Date.now();
    let scores: ReturnType<typeof calculateImpactScores>;

    if (
      cached &&
      cached.commitCount === commits.length &&
      cached.branchCount === branchCount &&
      now - cached.computedAt < CACHE_TTL_MS
    ) {
      scores = cached.scores;
    } else {
      const branchHeadHashes = new Set(branches.map((b) => b.headCommitHash));
      const inputs: ImpactCommitInput[] = commits.map((c) => ({
        hash: c.hash,
        author: c.author,
        message: c.message,
        commitDate: c.commitDate,
        parentHashes: c.parentHashes,
      }));

      await this.enrichWithNumstat(inputs, repository.localPath, 500);

      scores = calculateImpactScores(inputs, branchHeadHashes);
      this.cache.set(repositoryId, {
        commitCount: commits.length,
        branchCount,
        scores,
        computedAt: now,
      });
    }

    let filtered = scores;

    if (options.contributor) {
      const q = options.contributor.toLowerCase();
      filtered = filtered.filter(
        (s) => s.author.toLowerCase().includes(q) || s.hash.toLowerCase().includes(q)
      );
    }
    if (options.fromDate) {
      const from = new Date(options.fromDate);
      filtered = filtered.filter((s) => s.commitDate >= from);
    }
    if (options.toDate) {
      const to = new Date(options.toDate);
      filtered = filtered.filter((s) => s.commitDate <= to);
    }
    if (options.minScore !== undefined && !Number.isNaN(options.minScore)) {
      const min = options.minScore;
      filtered = filtered.filter((s) => s.impactScore >= min);
    }
    if (options.branch) {
      const branch = branches.find((b) => b.name === options.branch);
      if (branch) {
        const head = branch.headCommitHash;
        const related = new Set<string>([head]);
        const parentMap = new Map(commits.map((c) => [c.hash, c.parentHashes]));
        const stack = [head];
        while (stack.length) {
          const h = stack.pop()!;
          for (const p of parentMap.get(h) ?? []) {
            if (!related.has(p)) {
              related.add(p);
              stack.push(p);
            }
          }
        }
        filtered = filtered.filter((s) => related.has(s.hash));
      }
    }

    const topCommits = getTopImpactCommits(filtered, limit).map((s) => ({
      hash: s.hash,
      message: s.message,
      author: s.author,
      date: s.commitDate.toISOString(),
      impactScore: s.impactScore,
      additions: s.additions,
      deletions: s.deletions,
      filesChanged: s.filesChanged,
    }));

    const insights = this.buildInsights(scores, branches, commits.length);

    return {
      repositoryId,
      topCommits,
      insights,
      scoreByHash: Object.fromEntries(
        scores.slice(0, 5000).map((s) => [s.hash, s.impactScore])
      ),
    };
  }

  private async enrichWithNumstat(
    inputs: ImpactCommitInput[],
    localPath: string,
    sampleSize: number
  ): Promise<void> {
    const exists = await this.gitService.repositoryExists(localPath);
    if (!exists) return;

    const sorted = [...inputs].sort(
      (a, b) => b.parentHashes.length - a.parentHashes.length
    );
    const sample = sorted.slice(0, sampleSize);

    for (const commit of sample) {
      try {
        const numstat = await this.gitService.getCommitNumstat(localPath, commit.hash);
        const parsed = parseNumstatOutput(numstat);
        commit.filesChanged = parsed.filesChanged;
        commit.additions = parsed.additions;
        commit.deletions = parsed.deletions;
      } catch {
        // keep defaults
      }
    }
  }

  private buildInsights(
    scores: ReturnType<typeof calculateImpactScores>,
    branches: { name: string; headCommitHash: string }[],
    totalCommits: number
  ): ImpactInsights {
    if (scores.length === 0) {
      return {
        mostImpactfulContributor: null,
        mostImpactfulBranch: null,
        mostImpactfulMonth: null,
        largestCommit: null,
        largestMerge: null,
      };
    }

    const byAuthor = new Map<string, number>();
    for (const s of scores) {
      byAuthor.set(s.author, (byAuthor.get(s.author) ?? 0) + s.impactScore);
    }
    let topAuthor = '';
    let topAuthorScore = 0;
    for (const [author, score] of byAuthor) {
      if (score > topAuthorScore) {
        topAuthorScore = score;
        topAuthor = author;
      }
    }

    const headScores = branches.map((b) => {
      const commit = scores.find((s) => s.hash === b.headCommitHash);
      return { name: b.name, score: commit?.impactScore ?? 0 };
    });
    const topBranch = headScores.sort((a, b) => b.score - a.score)[0];

    const byMonth = new Map<string, number>();
    for (const s of scores) {
      const d = s.commitDate;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + s.impactScore);
    }
    let topMonth = '';
    let topMonthScore = 0;
    for (const [month, score] of byMonth) {
      if (score > topMonthScore) {
        topMonthScore = score;
        topMonth = month;
      }
    }

    const largest = [...scores].sort((a, b) => b.impactScore - a.impactScore)[0];
    const largestMerge = scores
      .filter((s) => s.mergeParticipation)
      .sort((a, b) => b.impactScore - a.impactScore)[0];

    return {
      mostImpactfulContributor: topAuthor
        ? { name: topAuthor, totalImpact: Math.round(topAuthorScore) }
        : null,
      mostImpactfulBranch: topBranch ? { name: topBranch.name, score: topBranch.score } : null,
      mostImpactfulMonth: topMonth ? { period: topMonth, totalImpact: Math.round(topMonthScore) } : null,
      largestCommit: largest
        ? {
            hash: largest.hash,
            impactScore: largest.impactScore,
            message: largest.message,
          }
        : null,
      largestMerge: largestMerge
        ? {
            hash: largestMerge.hash,
            impactScore: largestMerge.impactScore,
            message: largestMerge.message,
          }
        : null,
      totalCommits,
    };
  }
}
