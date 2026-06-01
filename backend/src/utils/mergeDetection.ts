/**
 * A merge commit has more than one parent.
 */
export function isMergeCommit(parentHashes: string[]): boolean {
  return parentHashes.length > 1;
}
