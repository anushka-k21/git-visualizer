import prisma from '../../utils/prisma';
import {
  aggregateContributorsFromCommits,
  contributorActivityBuckets,
  CommitAuthorRow,
} from '../../utils/contributorAggregation';
import { ContributorDetail, ContributorListItem, SyncContributorsResult } from '../../types';

export class ContributorAnalyticsService {
  async syncContributors(repositoryId: string): Promise<SyncContributorsResult> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const commits = await this.loadCommitRows(repositoryId);
    const aggregated = aggregateContributorsFromCommits(commits);

    await prisma.$transaction(async (tx) => {
      await tx.contributor.deleteMany({ where: { repositoryId } });
      if (aggregated.length > 0) {
        await tx.contributor.createMany({
          data: aggregated.map((c) => ({
            name: c.name,
            email: c.email,
            repositoryId,
            totalCommits: c.totalCommits,
            firstCommitDate: c.firstCommitDate,
            lastCommitDate: c.lastCommitDate,
          })),
        });
      }
    });

    return { repositoryId, contributorsSynced: aggregated.length };
  }

  async listContributors(repositoryId: string): Promise<ContributorListItem[]> {
    await this.ensureContributorsSynced(repositoryId);

    const contributors = await prisma.contributor.findMany({
      where: { repositoryId },
      orderBy: { totalCommits: 'desc' },
    });

    return contributors.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      totalCommits: c.totalCommits,
      firstCommitDate: c.firstCommitDate.toISOString(),
      lastCommitDate: c.lastCommitDate.toISOString(),
    }));
  }

  async getContributorDetail(
    repositoryId: string,
    contributorId: string
  ): Promise<ContributorDetail> {
    const contributor = await prisma.contributor.findFirst({
      where: { id: contributorId, repositoryId },
    });
    if (!contributor) throw new Error('Contributor not found');

    const commits = await this.loadCommitRows(repositoryId);
    const emailCommits = commits.filter(
      (c) => c.email.trim().toLowerCase() === contributor.email.trim().toLowerCase()
    );

    return {
      id: contributor.id,
      name: contributor.name,
      email: contributor.email,
      totalCommits: contributor.totalCommits,
      firstCommitDate: contributor.firstCommitDate.toISOString(),
      lastCommitDate: contributor.lastCommitDate.toISOString(),
      commitsPerWeek: contributorActivityBuckets(emailCommits, contributor.email, 'week'),
      commitsPerMonth: contributorActivityBuckets(emailCommits, contributor.email, 'month'),
      recentCommits: emailCommits
        .sort((a, b) => b.commitDate.getTime() - a.commitDate.getTime())
        .slice(0, 10)
        .map((c) => ({
          hash: c.hash,
          message: c.message,
          commitDate: c.commitDate.toISOString(),
        })),
    };
  }

  private async ensureContributorsSynced(repositoryId: string): Promise<void> {
    const count = await prisma.contributor.count({ where: { repositoryId } });
    const commitCount = await prisma.commit.count({ where: { repositoryId } });
    if (commitCount > 0 && count === 0) {
      await this.syncContributors(repositoryId);
    }
  }

  private async loadCommitRows(repositoryId: string): Promise<CommitAuthorRow[]> {
    return prisma.commit.findMany({
      where: { repositoryId },
      select: {
        hash: true,
        author: true,
        email: true,
        message: true,
        commitDate: true,
        parentHashes: true,
      },
    });
  }
}
