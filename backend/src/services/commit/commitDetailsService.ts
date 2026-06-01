import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import { CommitDetails } from '../../types';
import { parseNumstatOutput } from '../../utils/commitShowParser';
import { isMergeCommit } from '../../utils/mergeDetection';

export class CommitDetailsService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async getCommitDetails(hash: string, repositoryId: string): Promise<CommitDetails> {
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

    const dbCommit = await prisma.commit.findUnique({
      where: {
        repositoryId_hash: { repositoryId, hash },
      },
    });

    if (!dbCommit) {
      throw new Error('Commit not found');
    }

    let filesChanged = 0;
    let additions = 0;
    let deletions = 0;

    try {
      const numstat = await this.gitService.getCommitNumstat(repository.localPath, hash);
      const parsed = parseNumstatOutput(numstat);
      filesChanged = parsed.filesChanged;
      additions = parsed.additions;
      deletions = parsed.deletions;
    } catch (error) {
      console.warn(`[CommitDetailsService] numstat failed for ${hash}:`, error);
    }

    const parentHashes = dbCommit.parentHashes;
    const mergeCommit = isMergeCommit(parentHashes);

    return {
      hash: dbCommit.hash,
      author: dbCommit.author,
      email: dbCommit.email,
      message: dbCommit.message,
      commitDate: dbCommit.commitDate,
      filesChanged,
      additions,
      deletions,
      parentHashes,
      isMergeCommit: mergeCommit,
    };
  }
}
