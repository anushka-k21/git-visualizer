import prisma from '../../utils/prisma';
import { GitService } from '../git/gitService';
import { parseRepositoryFile, shouldIncludeRepoFile } from '../../utils/filePathFilter';
import { FileHistoryEntry, RepositoryFile } from '../../types';

const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 200;

export class FileService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async listFiles(repositoryId: string, search?: string): Promise<RepositoryFile[]> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const exists = await this.gitService.repositoryExists(repository.localPath);
    if (!exists) throw new Error('Local clone not found or invalid');

    const rawFiles = await this.gitService.listRepositoryFiles(repository.localPath);
    let files = rawFiles
      .filter(shouldIncludeRepoFile)
      .map(parseRepositoryFile)
      .sort((a, b) => a.path.localeCompare(b.path));

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      files = files.filter(
        (f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
      );
    }

    return files;
  }

  async getFileHistory(
    repositoryId: string,
    filePath: string,
    options: { limit?: number; skip?: number; sort?: 'newest' | 'oldest' } = {}
  ): Promise<{ entries: FileHistoryEntry[]; hasMore: boolean }> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    if (!filePath?.trim()) throw new Error('File path is required');

    const exists = await this.gitService.repositoryExists(repository.localPath);
    if (!exists) throw new Error('Local clone not found or invalid');

    const limit = Math.min(options.limit ?? DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);
    const skip = options.skip ?? 0;

    const raw = await this.gitService.getFileHistory(
      repository.localPath,
      filePath.trim(),
      limit + 1,
      skip
    );

    const hasMore = raw.length > limit;
    let entries: FileHistoryEntry[] = raw.slice(0, limit).map((e) => ({
      hash: e.hash,
      author: e.author,
      message: e.message,
      commitDate: e.commitDate.toISOString(),
    }));

    if (options.sort === 'oldest') {
      entries = [...entries].sort(
        (a, b) => new Date(a.commitDate).getTime() - new Date(b.commitDate).getTime()
      );
    }

    return { entries, hasMore };
  }
}
