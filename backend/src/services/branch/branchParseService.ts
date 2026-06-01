import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import { collectAncestorHashes } from '../../utils/branchGraph';
import { BranchListItem, SyncBranchesResult } from '../../types';

export class BranchParseService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async syncBranches(repositoryId: string): Promise<SyncBranchesResult> {
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

    const { current, branches } = await this.gitService.listBranches(repository.localPath);

    await prisma.$transaction(async (tx) => {
      await tx.branch.deleteMany({ where: { repositoryId } });

      if (branches.length > 0) {
        await tx.branch.createMany({
          data: branches.map((b) => ({
            name: b.name,
            repositoryId,
            headCommitHash: b.headCommitHash,
            isDefault: b.name === current,
          })),
        });
      }
    });

    console.log(
      `[BranchParseService] Synced ${branches.length} branches for ${repository.owner}/${repository.name}`
    );

    return {
      repositoryId,
      branchesSynced: branches.length,
      activeBranch: current,
    };
  }

  async listBranches(repositoryId: string): Promise<BranchListItem[]> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const branches = await prisma.branch.findMany({
      where: { repositoryId },
      orderBy: { name: 'asc' },
    });

    if (branches.length === 0) {
      return [];
    }

    const commits = await prisma.commit.findMany({
      where: { repositoryId },
      select: { hash: true, parentHashes: true },
    });

    return branches.map((branch) => {
      const ancestors = collectAncestorHashes(branch.headCommitHash, commits);
      return {
        id: branch.id,
        name: branch.name,
        headCommitHash: branch.headCommitHash,
        isDefault: branch.isDefault,
        commitCount: ancestors.size,
      };
    });
  }
}
