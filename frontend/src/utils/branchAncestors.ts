import { CommitListItem } from '../types';

export function collectAncestorHashesFromList(
  headHash: string,
  commits: Pick<CommitListItem, 'hash' | 'parents'>[]
): Set<string> {
  const parentMap = new Map<string, string[]>();
  const known = new Set<string>();

  for (const commit of commits) {
    parentMap.set(commit.hash, commit.parents);
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
