import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import { BranchComparison, ComparisonCommitSummary } from '../../types';
import { parseNumstatOutput } from '../../utils/commitShowParser';

export class BranchComparisonService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async compare(
    repositoryId: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<BranchComparison> {
    if (sourceBranch === targetBranch) {
      throw new Error('Source and target branches must be different');
    }

    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const exists = await this.gitService.repositoryExists(repository.localPath);
    if (!exists) throw new Error('Local clone not found or invalid');

    const [sourceRef, targetRef] = await Promise.all([
      this.resolveBranchRef(repositoryId, repository.localPath, sourceBranch),
      this.resolveBranchRef(repositoryId, repository.localPath, targetBranch),
    ]);

    const mergeBase = await this.gitService.getMergeBase(
      repository.localPath,
      sourceRef,
      targetRef
    );

    const aheadCount = await this.gitService.getRevListCount(
      repository.localPath,
      `${mergeBase}..${sourceRef}`
    );
    const behindCount = await this.gitService.getRevListCount(
      repository.localPath,
      `${mergeBase}..${targetRef}`
    );

    const [sourceLogs, targetLogs, numstat] = await Promise.all([
      this.gitService.getLogForRange(
        repository.localPath,
        `${mergeBase}..${sourceRef}`,
        150
      ),
      this.gitService.getLogForRange(
        repository.localPath,
        `${mergeBase}..${targetRef}`,
        150
      ),
      this.gitService.getDiffNumstat(
        repository.localPath,
        `${mergeBase}..${sourceRef}`
      ),
    ]);

    const stats = parseNumstatOutput(numstat);
    const changedFiles = numstat
      .split('\n')
      .filter((l) => l.trim())
      .map((line) => {
        const parts = line.split('\t');
        return parts[2]?.trim() ?? '';
      })
      .filter(Boolean);

    const mapCommit = (c: {
      hash: string;
      author: string;
      message: string;
      commitDate: Date;
    }): ComparisonCommitSummary => ({
      hash: c.hash,
      author: c.author,
      message: c.message,
      commitDate: c.commitDate.toISOString(),
    });

    return {
      sourceBranch,
      targetBranch,
      mergeBase,
      aheadCount,
      behindCount,
      additions: stats.additions,
      deletions: stats.deletions,
      changedFiles,
      sourceUniqueCommits: sourceLogs.map(mapCommit),
      targetUniqueCommits: targetLogs.map(mapCommit),
    };
  }

  private async resolveBranchRef(
    repositoryId: string,
    localPath: string,
    branchName: string
  ): Promise<string> {
    const branch = await prisma.branch.findUnique({
      where: { repositoryId_name: { repositoryId, name: branchName } },
    });
    if (branch) return branch.headCommitHash;
    return this.gitService.resolveRef(localPath, branchName);
  }
}
