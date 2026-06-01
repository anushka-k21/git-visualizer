import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import { SyncResult } from '../../types';

const BATCH_SIZE = 500;

export class CommitParseService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async sync(repositoryId: string): Promise<SyncResult> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const exists = await this.gitService.repositoryExists(repository.localPath);
    if (!exists) {
      throw new Error('Local clone not found or invalid');
    }

    await this.gitService.ensureFullHistory(repository.localPath);
    const rawCommits = await this.gitService.getCommitLogLines(repository.localPath);
    const commitsParsed = rawCommits.length;

    let commitsStored = 0;

    for (let i = 0; i < rawCommits.length; i += BATCH_SIZE) {
      const batch = rawCommits.slice(i, i + BATCH_SIZE);
      const result = await prisma.$transaction(async (tx) => {
        return tx.commit.createMany({
          data: batch.map((c) => ({
            hash: c.hash,
            parentHashes: c.parentHashes,
            author: c.author,
            email: c.email,
            message: c.message,
            commitDate: c.commitDate,
            repositoryId,
          })),
          skipDuplicates: true,
        });
      });
      commitsStored += result.count;
    }

    console.log(
      `[CommitParseService] Synced ${repository.owner}/${repository.name}: parsed=${commitsParsed}, stored=${commitsStored}`
    );

    return { repositoryId, commitsParsed, commitsStored };
  }

  async listCommits(repositoryId: string) {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const commits = await prisma.commit.findMany({
      where: { repositoryId },
      orderBy: { commitDate: 'desc' },
      select: {
        hash: true,
        author: true,
        message: true,
        commitDate: true,
        parentHashes: true,
      },
    });

    return commits.map((c) => ({
      hash: c.hash,
      author: c.author,
      message: c.message,
      commitDate: c.commitDate,
      parents: c.parentHashes,
    }));
  }
}
