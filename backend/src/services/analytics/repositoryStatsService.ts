import prisma from '../../utils/prisma';
import { calculateRepositoryStats } from '../../utils/repositoryStatsCalculator';
import { RepositoryStats } from '../../types';
import { aggregateContributorsFromCommits } from '../../utils/contributorAggregation';

export class RepositoryStatsService {
  async getStats(repositoryId: string): Promise<RepositoryStats> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const [commits, branchCount, contributorCount] = await Promise.all([
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
      prisma.branch.count({ where: { repositoryId } }),
      prisma.contributor.count({ where: { repositoryId } }),
    ]);

    const stats = calculateRepositoryStats(commits, branchCount, contributorCount);

    const commitsByContributor = aggregateContributorsFromCommits(commits)
      .sort((a, b) => b.totalCommits - a.totalCommits)
      .slice(0, 15)
      .map((c) => ({
        name: c.name,
        email: c.email,
        totalCommits: c.totalCommits,
      }));

    const commitsOverTime = this.buildCommitsOverTime(commits);

    return {
      ...stats,
      commitsByContributor,
      commitsOverTime,
    };
  }

  private buildCommitsOverTime(
    commits: { commitDate: Date }[]
  ): { period: string; count: number }[] {
    const buckets = new Map<string, number>();
    for (const commit of commits) {
      const d = commit.commitDate;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}
