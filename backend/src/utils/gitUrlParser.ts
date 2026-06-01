import { ParsedGitUrl } from '../types';

/**
 * Parses a GitHub/GitLab/Bitbucket URL and extracts owner and repo name.
 * Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   git@github.com:owner/repo.git
 */
export function parseGitUrl(url: string): ParsedGitUrl {
  const trimmed = url.trim();

  // SSH format: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@[^:]+:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], name: sshMatch[2] };
  }

  // HTTPS format: https://github.com/owner/repo[.git]
  const httpsMatch = trimmed.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], name: httpsMatch[2] };
  }

  throw new Error(`Unable to parse Git URL: "${url}". Expected format: https://github.com/owner/repo`);
}

export function isValidGitUrl(url: string): boolean {
  try {
    parseGitUrl(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
}
