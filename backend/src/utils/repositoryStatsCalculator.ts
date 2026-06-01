import {
  aggregateContributorsFromCommits,
  CommitAuthorRow,
  countActiveContributorsLast30Days,
  countMergeCommits,
} from './contributorAggregation';

export interface RepositoryStatsResult {
  totalCommits: number;
  totalBranches: number;
  totalContributors: number;
  totalMergeCommits: number;
  averageCommitsPerDay: number;
  repositoryAgeDays: number;
  repositoryAgeYears: number;
  firstCommitDate: string | null;
  latestCommitDate: string | null;
  averageCommitsPerContributor: number;
  activeContributorsLast30Days: number;
  mostActiveContributor: { name: string; email: string; totalCommits: number } | null;
}

export function calculateRepositoryStats(
  commits: CommitAuthorRow[],
  branchCount: number,
  contributorCount: number
): RepositoryStatsResult {
  if (commits.length === 0) {
    return {
      totalCommits: 0,
      totalBranches: branchCount,
      totalContributors: contributorCount,
      totalMergeCommits: 0,
      averageCommitsPerDay: 0,
      repositoryAgeDays: 0,
      repositoryAgeYears: 0,
      firstCommitDate: null,
      latestCommitDate: null,
      averageCommitsPerContributor: 0,
      activeContributorsLast30Days: 0,
      mostActiveContributor: null,
    };
  }

  const sorted = [...commits].sort(
    (a, b) => a.commitDate.getTime() - b.commitDate.getTime()
  );
  const first = sorted[0].commitDate;
  const latest = sorted[sorted.length - 1].commitDate;
  const ageMs = Math.max(latest.getTime() - first.getTime(), 86_400_000);
  const repositoryAgeDays = Math.max(1, Math.ceil(ageMs / 86_400_000));
  const repositoryAgeYears =
    Math.round((repositoryAgeDays / 365.25) * 10) / 10;

  const contributors = aggregateContributorsFromCommits(commits);
  const top = [...contributors].sort((a, b) => b.totalCommits - a.totalCommits)[0] ?? null;

  const totalContributors = contributorCount > 0 ? contributorCount : contributors.length;

  return {
    totalCommits: commits.length,
    totalBranches: branchCount,
    totalContributors,
    totalMergeCommits: countMergeCommits(commits),
    averageCommitsPerDay:
      Math.round((commits.length / repositoryAgeDays) * 100) / 100,
    repositoryAgeDays,
    repositoryAgeYears,
    firstCommitDate: first.toISOString(),
    latestCommitDate: latest.toISOString(),
    averageCommitsPerContributor:
      totalContributors > 0
        ? Math.round((commits.length / totalContributors) * 100) / 100
        : 0,
    activeContributorsLast30Days: countActiveContributorsLast30Days(commits),
    mostActiveContributor: top
      ? { name: top.name, email: top.email, totalCommits: top.totalCommits }
      : null,
  };
}
