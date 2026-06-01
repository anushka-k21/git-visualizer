import { describe, expect, it } from 'vitest';
import {
  aggregateContributorsFromCommits,
  countActiveContributorsLast30Days,
  countMergeCommits,
} from '../utils/contributorAggregation';
import { calculateRepositoryStats } from '../utils/repositoryStatsCalculator';
import { aggregateHeatmap } from '../utils/heatmapAggregation';
import { shouldIncludeRepoFile } from '../utils/filePathFilter';

describe('aggregateContributorsFromCommits', () => {
  it('groups by email and picks dominant name', () => {
    const result = aggregateContributorsFromCommits([
      {
        hash: '1',
        author: 'Alice',
        email: 'alice@example.com',
        message: 'a',
        commitDate: new Date('2024-01-01'),
        parentHashes: [],
      },
      {
        hash: '2',
        author: 'A. Dev',
        email: 'alice@example.com',
        message: 'b',
        commitDate: new Date('2024-06-01'),
        parentHashes: [],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].totalCommits).toBe(2);
    expect(result[0].email).toBe('alice@example.com');
  });

  it('separates different emails', () => {
    const result = aggregateContributorsFromCommits([
      {
        hash: '1',
        author: 'A',
        email: 'a@test.com',
        message: '',
        commitDate: new Date(),
        parentHashes: [],
      },
      {
        hash: '2',
        author: 'B',
        email: 'b@test.com',
        message: '',
        commitDate: new Date(),
        parentHashes: [],
      },
    ]);
    expect(result).toHaveLength(2);
  });
});

describe('repository stats', () => {
  it('calculates merge commits and age', () => {
    const commits = [
      {
        hash: '1',
        author: 'A',
        email: 'a@test.com',
        message: '',
        commitDate: new Date('2020-01-01'),
        parentHashes: [],
      },
      {
        hash: '2',
        author: 'A',
        email: 'a@test.com',
        message: '',
        commitDate: new Date('2024-01-01'),
        parentHashes: ['1', 'x'],
      },
    ];
    expect(countMergeCommits(commits)).toBe(1);
    const stats = calculateRepositoryStats(commits, 2, 1);
    expect(stats.totalCommits).toBe(2);
    expect(stats.totalMergeCommits).toBe(1);
    expect(stats.repositoryAgeDays).toBeGreaterThan(0);
  });

  it('counts active contributors in last 30 days', () => {
    const now = new Date();
    const commits = [
      {
        hash: '1',
        author: 'A',
        email: 'recent@test.com',
        message: '',
        commitDate: now,
        parentHashes: [],
      },
      {
        hash: '2',
        author: 'B',
        email: 'old@test.com',
        message: '',
        commitDate: new Date('2019-01-01'),
        parentHashes: [],
      },
    ];
    expect(countActiveContributorsLast30Days(commits, now)).toBe(1);
  });
});

describe('aggregateHeatmap', () => {
  it('aggregates commits by date', () => {
    const entries = aggregateHeatmap(
      [
        { commitDate: new Date('2024-06-01T12:00:00Z') },
        { commitDate: new Date('2024-06-01T18:00:00Z') },
        { commitDate: new Date('2024-06-02T12:00:00Z') },
      ],
      'all'
    );
    const june1 = entries.find((e) => e.date === '2024-06-01');
    expect(june1?.commitCount).toBe(2);
  });
});

describe('shouldIncludeRepoFile', () => {
  it('excludes node_modules', () => {
    expect(shouldIncludeRepoFile('node_modules/pkg/index.js')).toBe(false);
    expect(shouldIncludeRepoFile('src/index.ts')).toBe(true);
  });
});
