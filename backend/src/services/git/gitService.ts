import simpleGit, { SimpleGit, CloneOptions } from 'simple-git';
import path from 'path';
import fs from 'fs';

export interface CloneResult {
  localPath: string;
  success: boolean;
}

const LOG_FORMAT = [
  'log',
  '--all',
  '--pretty=format:%H%x1f%P%x1f%an%x1f%ae%x1f%at%x1f%s',
  '--encoding=UTF-8',
];

export interface RawCommitLine {
  hash: string;
  parentHashes: string[];
  author: string;
  email: string;
  commitDate: Date;
  message: string;
}

export class GitService {
  private repositoriesPath: string;

  constructor(repositoriesPath: string) {
    this.repositoriesPath = path.resolve(repositoriesPath);
    this.ensureRepositoriesDir();
  }

  private ensureRepositoriesDir(): void {
    if (!fs.existsSync(this.repositoriesPath)) {
      fs.mkdirSync(this.repositoriesPath, { recursive: true });
      console.log(`[GitService] Created repositories directory: ${this.repositoriesPath}`);
    }
  }

  private getGit(localPath: string): SimpleGit {
    return simpleGit(localPath);
  }

  async cloneRepository(url: string, owner: string, repoName: string): Promise<CloneResult> {
    const folderName = `${owner}__${repoName}`;
    const localPath = path.join(this.repositoriesPath, folderName);

    if (fs.existsSync(localPath)) {
      console.log(`[GitService] Repository already exists at: ${localPath}`);
      return { localPath, success: true };
    }

    console.log(`[GitService] Cloning ${url} into ${localPath}...`);

    const git: SimpleGit = simpleGit();
    const cloneOptions: CloneOptions = {};

    await git.clone(url, localPath, cloneOptions);

    console.log(`[GitService] Successfully cloned ${url}`);
    return { localPath, success: true };
  }

  async ensureFullHistory(localPath: string): Promise<void> {
    const shallowFile = path.join(localPath, '.git', 'shallow');
    if (!fs.existsSync(shallowFile)) {
      return;
    }

    console.log(`[GitService] Unshallowing repository at: ${localPath}`);
    const git = this.getGit(localPath);
    await git.fetch(['--unshallow']);
    console.log(`[GitService] Unshallow complete for: ${localPath}`);
  }

  async getCommitLogLines(localPath: string): Promise<RawCommitLine[]> {
    const git = this.getGit(localPath);
    const output = await git.raw(LOG_FORMAT);

    if (!output.trim()) {
      return [];
    }

    const lines = output.split('\n').filter((line) => line.length > 0);
    const commits: RawCommitLine[] = [];

    for (const line of lines) {
      const parts = line.split('\x1f');
      if (parts.length < 6) continue;

      const [hash, parentsRaw, author, email, timestamp, ...messageParts] = parts;
      const message = messageParts.join('\x1f');
      const parentHashes = parentsRaw
        .trim()
        .split(/\s+/)
        .filter((p) => p.length > 0);

      const commitTime = Number.parseInt(timestamp, 10);
      if (Number.isNaN(commitTime)) continue;

      commits.push({
        hash,
        parentHashes,
        author,
        email,
        commitDate: new Date(commitTime * 1000),
        message,
      });
    }

    return commits;
  }

  async repositoryExists(localPath: string): Promise<boolean> {
    if (!fs.existsSync(localPath)) return false;
    try {
      const git = this.getGit(localPath);
      await git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getCommitNumstat(localPath: string, hash: string): Promise<string> {
    const git = this.getGit(localPath);
    return git.raw(['diff-tree', '--no-commit-id', '--numstat', '-r', hash]);
  }

  async listBranches(localPath: string): Promise<{
    current: string;
    branches: { name: string; headCommitHash: string }[];
  }> {
    const git = this.getGit(localPath);
    const summary = await git.branchLocal();
    const branches = Object.entries(summary.branches).map(([name, detail]) => ({
      name,
      headCommitHash: detail.commit,
    }));

    return { current: summary.current, branches };
  }

  deleteRepository(localPath: string): void {
    if (fs.existsSync(localPath)) {
      fs.rmSync(localPath, { recursive: true, force: true });
      console.log(`[GitService] Deleted repository at: ${localPath}`);
    }
  }
}
