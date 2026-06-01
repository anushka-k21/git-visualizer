export interface CommitParentRef {
  hash: string;
  parentHashes: string[];
}

/**
 * Collect all ancestors of head (inclusive) using stored parent links.
 */
export function collectAncestorHashes(
  headHash: string,
  commits: CommitParentRef[]
): Set<string> {
  const parentMap = new Map<string, string[]>();
  const known = new Set<string>();

  for (const commit of commits) {
    parentMap.set(commit.hash, commit.parentHashes);
    known.add(commit.hash);
  }

  if (!known.has(headHash)) {
    return new Set();
  }

  const ancestors = new Set<string>();
  const stack = [headHash];

  while (stack.length > 0) {
    const hash = stack.pop()!;
    if (ancestors.has(hash)) continue;
    ancestors.add(hash);

    for (const parent of parentMap.get(hash) ?? []) {
      if (known.has(parent)) {
        stack.push(parent);
      }
    }
  }

  return ancestors;
}

export function parseRemoteBranchName(ref: string): string {
  return ref.replace(/^remotes\/origin\//, '').replace(/^origin\//, '');
}
