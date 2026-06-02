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
    const [localSummary, allSummary] = await Promise.all([
      git.branchLocal(),
      git.branch(['-a']),
    ]);

    const branchesByName = new Map<string, { name: string; ref: string; headCommitHash: string }>();

    const addBranch = (name: string, headCommitHash: string, preferExisting = false): void => {
      const normalizedName = name
        .replace(/^\*?\s*/, '')
        .replace(/^remotes\/origin\//, '')
        .replace(/^origin\//, '')
        .trim();

      if (
        !normalizedName ||
        normalizedName === 'HEAD' ||
        normalizedName.includes(' -> ') ||
        !headCommitHash
      ) {
        return;
      }

      if (preferExisting && branchesByName.has(normalizedName)) {
        return;
      }

      const ref = name.replace(/^remotes\//, '').trim();
      branchesByName.set(normalizedName, { name: normalizedName, ref, headCommitHash });
    };

    for (const [name, detail] of Object.entries(localSummary.branches)) {
      addBranch(name, detail.commit);
    }

    for (const [name, detail] of Object.entries(allSummary.branches)) {
      addBranch(name, detail.commit, true);
    }

    const branches = await Promise.all(
      Array.from(branchesByName.values()).map(async (branch) => {
        let headCommitHash = branch.headCommitHash;
        try {
          headCommitHash = (await git.revparse([branch.ref])).trim();
        } catch {
          try {
            headCommitHash = (await git.revparse([branch.headCommitHash])).trim();
          } catch {
            // Keep the branch-list hash as a last resort; callers can still display the branch.
          }
        }
        return { name: branch.name, headCommitHash };
      })
    );

    return { current: localSummary.current, branches };
  }

  async listRepositoryFiles(localPath: string): Promise<string[]> {
    const git = this.getGit(localPath);
    const output = await git.raw(['ls-files']);
    if (!output.trim()) return [];
    return output.split('\n').filter((line) => line.trim().length > 0);
  }

  async getFileHistory(
    localPath: string,
    filePath: string,
    limit = 100,
    skip = 0
  ): Promise<
    { hash: string; author: string; email: string; message: string; commitDate: Date }[]
  > {
    const git = this.getGit(localPath);
    const output = await git.raw([
      'log',
      '--follow',
      `--max-count=${limit + skip}`,
      '--skip=' + String(skip),
      '--pretty=format:%H%x1f%an%x1f%ae%x1f%at%x1f%s',
      '--encoding=UTF-8',
      '--',
      filePath,
    ]);

    if (!output.trim()) return [];

    const lines = output.split('\n').filter((line) => line.length > 0);
    const entries: {
      hash: string;
      author: string;
      email: string;
      message: string;
      commitDate: Date;
    }[] = [];

    for (const line of lines.slice(0, limit)) {
      const parts = line.split('\x1f');
      if (parts.length < 5) continue;
      const [hash, author, email, timestamp, ...messageParts] = parts;
      const commitTime = Number.parseInt(timestamp, 10);
      if (Number.isNaN(commitTime)) continue;
      entries.push({
        hash,
        author,
        email,
        message: messageParts.join('\x1f'),
        commitDate: new Date(commitTime * 1000),
      });
    }

    return entries;
  }

  async getCommitShowPatch(localPath: string, hash: string, filePath?: string): Promise<string> {
    const git = this.getGit(localPath);
    const args = ['show', hash, '--pretty=format:', '--patch-with-stat'];
    if (filePath) {
      args.push('--', filePath);
    }
    return git.raw(args);
  }

  async getCommitShowHeader(localPath: string, hash: string): Promise<{
    author: string;
    commitDate: Date;
    message: string;
  }> {
    const git = this.getGit(localPath);
    const output = await git.raw([
      'show',
      hash,
      '-s',
      '--pretty=format:%an%x1f%at%x1f%s',
      '--encoding=UTF-8',
    ]);
    const parts = output.trim().split('\x1f');
    const timestamp = Number.parseInt(parts[1] ?? '0', 10);
    return {
      author: parts[0] ?? '',
      commitDate: new Date(timestamp * 1000),
      message: parts.slice(2).join('\x1f'),
    };
  }

  async getCommitNumstatForShow(localPath: string, hash: string): Promise<string> {
    const git = this.getGit(localPath);
    return git.raw(['show', hash, '--pretty=format:', '--numstat']);
  }

  async resolveRef(localPath: string, ref: string): Promise<string> {
    const git = this.getGit(localPath);
    return (await git.revparse([ref])).trim();
  }

  async getMergeBase(localPath: string, refA: string, refB: string): Promise<string> {
    const git = this.getGit(localPath);
    return (await git.raw(['merge-base', refA, refB])).trim();
  }

  async getRevListCount(localPath: string, range: string): Promise<number> {
    const git = this.getGit(localPath);
    const output = await git.raw(['rev-list', '--count', range]);
    return Number.parseInt(output.trim(), 10) || 0;
  }

  async getRevListHashes(localPath: string, range: string, limit = 200): Promise<string[]> {
    const git = this.getGit(localPath);
    const output = await git.raw(['rev-list', range, `--max-count=${limit}`]);
    return output.split('\n').filter((h) => h.length > 0);
  }

  async getLogForRange(
    localPath: string,
    range: string,
    limit = 100
  ): Promise<{ hash: string; author: string; message: string; commitDate: Date }[]> {
    const git = this.getGit(localPath);
    const output = await git.raw([
      'log',
      range,
      `--max-count=${limit}`,
      '--pretty=format:%H%x1f%an%x1f%at%x1f%s',
      '--encoding=UTF-8',
    ]);
    if (!output.trim()) return [];
    return output.split('\n').filter(Boolean).map((line) => {
      const [hash, author, timestamp, ...msg] = line.split('\x1f');
      return {
        hash,
        author,
        message: msg.join('\x1f'),
        commitDate: new Date(Number.parseInt(timestamp, 10) * 1000),
      };
    });
  }

  async getDiffNumstat(localPath: string, range: string): Promise<string> {
    const git = this.getGit(localPath);
    return git.raw(['diff', '--numstat', range]);
  }

  async getDiffPatch(localPath: string, range: string, maxFiles = 30): Promise<string> {
    const git = this.getGit(localPath);
    return git.raw(['diff', range, `--max-count=${maxFiles}`]);
  }

  deleteRepository(localPath: string): void {
    if (fs.existsSync(localPath)) {
      fs.rmSync(localPath, { recursive: true, force: true });
      console.log(`[GitService] Deleted repository at: ${localPath}`);
    }
  }
}
