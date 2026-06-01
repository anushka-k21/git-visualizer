import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import { parseNumstatAndPatches, parseGitShowOutput } from '../../utils/diffParser';
import { CommitDiff } from '../../types';

const MAX_FILES_WITH_PATCH = 80;
const MAX_PATCH_CHARS = 120_000;

export class DiffService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async getCommitDiff(
    hash: string,
    repositoryId: string,
    filePath?: string
  ): Promise<CommitDiff> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const exists = await this.gitService.repositoryExists(repository.localPath);
    if (!exists) throw new Error('Local clone not found or invalid');

    const dbCommit = await prisma.commit.findUnique({
      where: { repositoryId_hash: { repositoryId, hash } },
    });

    let header: { author: string; message: string; commitDate: Date };
    if (dbCommit) {
      header = {
        author: dbCommit.author,
        message: dbCommit.message,
        commitDate: dbCommit.commitDate,
      };
    } else {
      const fromGit = await this.gitService.getCommitShowHeader(repository.localPath, hash);
      header = { ...fromGit, message: fromGit.message };
    }

    if (filePath) {
      const patch = await this.gitService.getCommitShowPatch(
        repository.localPath,
        hash,
        filePath
      );
      const parsed = parseGitShowOutput(hash, header, patch);
      const file = parsed.files[0];
      return {
        commitHash: hash,
        author: header.author,
        message: header.message,
        commitDate: header.commitDate.toISOString(),
        files: file
          ? [
              {
                path: file.path,
                oldPath: file.oldPath,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                patch: file.patch,
              },
            ]
          : [],
      };
    }

    const numstat = await this.gitService.getCommitNumstatForShow(repository.localPath, hash);
    const numstatLines = numstat.split('\n').filter((l) => l.trim().length > 0);
    const filePaths: string[] = [];

    for (const line of numstatLines) {
      const tabParts = line.split('\t');
      if (tabParts.length < 3) continue;
      const pathRaw = tabParts[2].trim();
      const path = pathRaw.includes(' => ')
        ? pathRaw.split(' => ')[1].replace(/[{}]/g, '').trim()
        : pathRaw;
      filePaths.push(path);
    }

    const patchesByPath = new Map<string, string>();
    let totalPatchChars = 0;

    for (const path of filePaths.slice(0, MAX_FILES_WITH_PATCH)) {
      if (totalPatchChars >= MAX_PATCH_CHARS) break;
      try {
        const patch = await this.gitService.getCommitShowPatch(
          repository.localPath,
          hash,
          path
        );
        const patchBody = patch.split('\n').slice(4).join('\n');
        patchesByPath.set(path, patchBody);
        totalPatchChars += patchBody.length;
      } catch {
        patchesByPath.set(path, null as unknown as string);
      }
    }

    const parsed = parseNumstatAndPatches(hash, header, numstat, patchesByPath);

    return {
      commitHash: hash,
      author: parsed.author,
      message: parsed.message,
      commitDate: parsed.commitDate.toISOString(),
      files: parsed.files.map((f) => ({
        path: f.path,
        oldPath: f.oldPath,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })),
    };
  }

  async getRangeDiff(
    repositoryId: string,
    range: string,
    maxFiles = 50
  ): Promise<CommitDiff> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const numstat = await this.gitService.getDiffNumstat(repository.localPath, range);
    const patch = await this.gitService.getDiffPatch(repository.localPath, range, maxFiles);

    const header = {
      author: 'Branch comparison',
      message: `Changes in ${range}`,
      commitDate: new Date(),
    };

    const patchesByPath = new Map<string, string>();
    const sections = patch.split(/^diff --git /m).filter((s) => s.trim());
    for (const section of sections) {
      const firstLine = section.split('\n')[0] ?? '';
      const pathMatch = firstLine.match(/b\/(.+)$/);
      if (pathMatch) {
        const body = section.split('\n').slice(1).join('\n');
        patchesByPath.set(pathMatch[1], body);
      }
    }

    const parsed = parseNumstatAndPatches('range', header, numstat, patchesByPath);
    return {
      commitHash: 'range',
      author: header.author,
      message: header.message,
      commitDate: header.commitDate.toISOString(),
      files: parsed.files.map((f) => ({
        path: f.path,
        oldPath: f.oldPath,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })),
    };
  }
}
