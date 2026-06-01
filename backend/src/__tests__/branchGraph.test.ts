import { describe, expect, it } from 'vitest';
import { collectAncestorHashes, parseRemoteBranchName } from '../utils/branchGraph';

describe('collectAncestorHashes', () => {
  const commits = [
    { hash: 'c3', parentHashes: ['c2'] },
    { hash: 'c2', parentHashes: ['c1'] },
    { hash: 'c1', parentHashes: [] },
    { hash: 'side', parentHashes: ['c1'] },
  ];

  it('collects linear ancestors', () => {
    const set = collectAncestorHashes('c3', commits);
    expect(set.has('c3')).toBe(true);
    expect(set.has('c2')).toBe(true);
    expect(set.has('c1')).toBe(true);
    expect(set.has('side')).toBe(false);
  });

  it('includes branch side commits when head is on branch', () => {
    const set = collectAncestorHashes('side', commits);
    expect(set.has('side')).toBe(true);
    expect(set.has('c1')).toBe(true);
    expect(set.has('c3')).toBe(false);
  });

  it('returns empty set for unknown head', () => {
    expect(collectAncestorHashes('missing', commits).size).toBe(0);
  });
});

describe('parseRemoteBranchName', () => {
  it('strips remotes/origin prefix', () => {
    expect(parseRemoteBranchName('remotes/origin/main')).toBe('main');
  });
});
