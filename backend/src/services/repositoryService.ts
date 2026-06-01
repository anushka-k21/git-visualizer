import prisma from '../utils/prisma';
import { GitService } from './git/gitService';
import { parseGitUrl, sanitizeFolderName } from '../utils/gitUrlParser';
import { ImportRepositoryRequest, Repository } from '../types';

export class RepositoryService {
  private gitService: GitService;

  constructor(repositoriesPath: string) {
    this.gitService = new GitService(repositoriesPath);
  }

  async importRepository(data: ImportRepositoryRequest): Promise<Repository> {
    const { url } = data;
    const { owner, name } = parseGitUrl(url);
    const normalizedUrl = url.trim().replace(/\.git$/, '');

    const existing = await prisma.repository.findUnique({
      where: { url: normalizedUrl },
    });

    if (existing) {
      throw new Error(`Repository "${owner}/${name}" is already imported.`);
    }

    const safeOwner = sanitizeFolderName(owner);
    const safeName = sanitizeFolderName(name);
    const { localPath } = await this.gitService.cloneRepository(url, safeOwner, safeName);

    const repository = await prisma.repository.create({
      data: { name, owner, url: normalizedUrl, localPath },
    });

    console.log(`[RepositoryService] Saved: ${owner}/${name} (id=${repository.id})`);
    return repository as Repository;
  }

  async getAllRepositories(): Promise<Repository[]> {
    const repos = await prisma.repository.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return repos as Repository[];
  }

  async getRepositoryById(id: string): Promise<Repository | null> {
    const repo = await prisma.repository.findUnique({ where: { id } });
    return repo as Repository | null;
  }

  async deleteRepository(id: string): Promise<void> {
    const repo = await prisma.repository.findUnique({ where: { id } });
    if (!repo) throw new Error('Repository not found');
    this.gitService.deleteRepository(repo.localPath);
    await prisma.repository.delete({ where: { id } });
  }
}
