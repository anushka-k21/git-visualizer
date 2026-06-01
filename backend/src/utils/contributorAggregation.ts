import { isMergeCommit } from './mergeDetection';
import { periodKeyForDate, TimelineGroupBy } from './timelineAggregation';

export interface CommitAuthorRow {
  hash: string;
  author: string;
  email: string;
  message: string;
  commitDate: Date;
  parentHashes: string[];
}

export interface AggregatedContributor {
  email: string;
  name: string;
  totalCommits: number;
  firstCommitDate: Date;
  lastCommitDate: Date;
}

export interface ContributorActivityBucket {
  period: string;
  count: number;
}

export function aggregateContributorsFromCommits(
  commits: CommitAuthorRow[]
): AggregatedContributor[] {
  const byEmail = new Map<string, AggregatedContributor & { nameVotes: Map<string, number> }>();

  for (const commit of commits) {
    const email = commit.email.trim().toLowerCase();
    if (!email) continue;

    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, {
        email,
        name: commit.author,
        totalCommits: 1,
        firstCommitDate: commit.commitDate,
        lastCommitDate: commit.commitDate,
        nameVotes: new Map([[commit.author, 1]]),
      });
      continue;
    }

    existing.totalCommits += 1;
    if (commit.commitDate < existing.firstCommitDate) {
      existing.firstCommitDate = commit.commitDate;
    }
    if (commit.commitDate > existing.lastCommitDate) {
      existing.lastCommitDate = commit.commitDate;
      existing.name = commit.author;
    }

    const votes = (existing.nameVotes.get(commit.author) ?? 0) + 1;
    existing.nameVotes.set(commit.author, votes);

    let topName = existing.name;
    let topVotes = 0;
    for (const [name, count] of existing.nameVotes) {
      if (count > topVotes) {
        topVotes = count;
        topName = name;
      }
    }
    existing.name = topName;
  }

  return Array.from(byEmail.values()).map(({ nameVotes: _votes, ...rest }) => rest);
}

export function contributorActivityBuckets(
  commits: CommitAuthorRow[],
  email: string,
  groupBy: TimelineGroupBy
): ContributorActivityBucket[] {
  const normalized = email.trim().toLowerCase();
  const buckets = new Map<string, number>();

  for (const commit of commits) {
    if (commit.email.trim().toLowerCase() !== normalized) continue;
    const key = periodKeyForDate(commit.commitDate, groupBy);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function countMergeCommits(commits: Pick<CommitAuthorRow, 'parentHashes'>[]): number {
  return commits.filter((c) => isMergeCommit(c.parentHashes)).length;
}

export function countActiveContributorsLast30Days(
  commits: CommitAuthorRow[],
  referenceDate = new Date()
): number {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - 30);

  const emails = new Set<string>();
  for (const commit of commits) {
    if (commit.commitDate >= cutoff) {
      emails.add(commit.email.trim().toLowerCase());
    }
  }
  return emails.size;
}
