export type TimelineGroupBy = 'day' | 'week' | 'month';

export interface TimelineCommitInput {
  hash: string;
  author: string;
  message: string;
  commitDate: Date;
}

export interface TimelineCommit {
  hash: string;
  author: string;
  message: string;
  commitDate: string;
}

export interface TimelinePeriod {
  period: string;
  commitCount: number;
  commits: TimelineCommit[];
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function toDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function toWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad2(week)}`;
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function periodKeyForDate(date: Date, groupBy: TimelineGroupBy): string {
  switch (groupBy) {
    case 'day':
      return toDayKey(date);
    case 'week':
      return toWeekKey(date);
    case 'month':
      return toMonthKey(date);
  }
}

export function aggregateTimeline(
  commits: TimelineCommitInput[],
  groupBy: TimelineGroupBy
): TimelinePeriod[] {
  const buckets = new Map<string, TimelineCommit[]>();

  for (const commit of commits) {
    const key = periodKeyForDate(commit.commitDate, groupBy);
    const list = buckets.get(key) ?? [];
    list.push({
      hash: commit.hash,
      author: commit.author,
      message: commit.message,
      commitDate: commit.commitDate.toISOString(),
    });
    buckets.set(key, list);
  }

  const periods: TimelinePeriod[] = [];

  for (const [period, periodCommits] of buckets) {
    periodCommits.sort(
      (a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime()
    );
    periods.push({
      period,
      commitCount: periodCommits.length,
      commits: periodCommits,
    });
  }

  periods.sort((a, b) => b.period.localeCompare(a.period));
  return periods;
}
