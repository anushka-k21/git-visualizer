import { isMergeCommit } from './mergeDetection';

export interface ImpactCommitInput {
  hash: string;
  author: string;
  message: string;
  commitDate: Date;
  parentHashes: string[];
  filesChanged?: number;
  additions?: number;
  deletions?: number;
}

export interface ImpactWeights {
  filesChanged: number;
  additions: number;
  deletions: number;
  mergeBonus: number;
  descendant: number;
  branchHead: number;
}

export const DEFAULT_IMPACT_WEIGHTS: ImpactWeights = {
  filesChanged: 3,
  additions: 0.4,
  deletions: 0.25,
  mergeBonus: 15,
  descendant: 2,
  branchHead: 10,
};

export interface CalculatedImpact {
  hash: string;
  author: string;
  message: string;
  commitDate: Date;
  impactScore: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  branchCountAffected: number;
  mergeParticipation: boolean;
}

export function buildDescendantCounts(
  commits: ImpactCommitInput[]
): Map<string, number> {
  const childrenMap = new Map<string, string[]>();
  const hashes = new Set(commits.map((c) => c.hash));

  for (const commit of commits) {
    for (const parent of commit.parentHashes) {
      if (!hashes.has(parent)) continue;
      const children = childrenMap.get(parent) ?? [];
      children.push(commit.hash);
      childrenMap.set(parent, children);
    }
  }

  const descendants = new Map<string, number>();

  const countDesc = (hash: string, visited: Set<string>): number => {
    if (visited.has(hash)) return 0;
    visited.add(hash);
    const children = childrenMap.get(hash) ?? [];
    let count = children.length;
    for (const child of children) {
      count += countDesc(child, visited);
    }
    return count;
  };

  for (const commit of commits) {
    descendants.set(commit.hash, countDesc(commit.hash, new Set()));
  }

  return descendants;
}

export function calculateImpactScores(
  commits: ImpactCommitInput[],
  branchHeadHashes: Set<string>,
  weights: ImpactWeights = DEFAULT_IMPACT_WEIGHTS
): CalculatedImpact[] {
  const descendants = buildDescendantCounts(commits);

  return commits.map((commit) => {
    const filesChanged = commit.filesChanged ?? 0;
    const additions = commit.additions ?? 0;
    const deletions = commit.deletions ?? 0;
    const mergeParticipation = isMergeCommit(commit.parentHashes);
    const descendantCount = descendants.get(commit.hash) ?? 0;
    const isHead = branchHeadHashes.has(commit.hash);

    let branchCountAffected = 0;
    if (isHead) branchCountAffected += 1;
    if (mergeParticipation) branchCountAffected += commit.parentHashes.length;

    const impactScore =
      filesChanged * weights.filesChanged +
      additions * weights.additions +
      deletions * weights.deletions +
      (mergeParticipation ? weights.mergeBonus : 0) +
      descendantCount * weights.descendant +
      (isHead ? weights.branchHead : 0);

    return {
      hash: commit.hash,
      author: commit.author,
      message: commit.message,
      commitDate: commit.commitDate,
      impactScore: Math.round(impactScore * 100) / 100,
      filesChanged,
      additions,
      deletions,
      branchCountAffected,
      mergeParticipation,
    };
  });
}

export function getTopImpactCommits(
  scores: CalculatedImpact[],
  limit: number
): CalculatedImpact[] {
  return [...scores].sort((a, b) => b.impactScore - a.impactScore).slice(0, limit);
}
