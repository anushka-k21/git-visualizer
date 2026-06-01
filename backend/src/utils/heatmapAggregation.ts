export interface HeatmapCommitRow {
  commitDate: Date;
}

export interface HeatmapEntry {
  date: string;
  commitCount: number;
}

import { HeatmapRange } from '../types';
export type { HeatmapRange };

function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function rangeStartDate(range: HeatmapRange, referenceDate: Date): Date | null {
  if (range === 'all') return null;
  const start = new Date(referenceDate);
  if (range === '30d') start.setDate(start.getDate() - 30);
  else if (range === '90d') start.setDate(start.getDate() - 90);
  else if (range === '1y') start.setFullYear(start.getFullYear() - 1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function aggregateHeatmap(
  commits: HeatmapCommitRow[],
  range: HeatmapRange = 'all',
  referenceDate = new Date()
): HeatmapEntry[] {
  const start = rangeStartDate(range, referenceDate);
  const buckets = new Map<string, number>();

  for (const commit of commits) {
    if (start && commit.commitDate < start) continue;
    const key = toDateKey(commit.commitDate);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const entries = Array.from(buckets.entries())
    .map(([date, commitCount]) => ({ date, commitCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) return entries;

  if (range === 'all' || !start) {
    return fillDateRange(entries, entries[0].date, entries[entries.length - 1].date);
  }

  const endKey = toDateKey(referenceDate);
  const startKey = toDateKey(start);
  return fillDateRange(entries, startKey, endKey);
}

function fillDateRange(entries: HeatmapEntry[], startKey: string, endKey: string): HeatmapEntry[] {
  const map = new Map(entries.map((e) => [e.date, e.commitCount]));
  const result: HeatmapEntry[] = [];
  const cursor = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);

  while (cursor <= end) {
    const key = toDateKey(cursor);
    result.push({ date: key, commitCount: map.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

export function parseHeatmapRange(value: string | undefined): HeatmapRange {
  if (value === '30d' || value === '90d' || value === '1y' || value === 'all') {
    return value;
  }
  return '1y';
}
