import { describe, expect, it } from 'vitest';
import {
  buildDescendantCounts,
  calculateImpactScores,
  getTopImpactCommits,
} from '../utils/impactCalculator';
import { parseUnifiedPatchLines } from '../utils/diffParser';

describe('impactCalculator', () => {
  const commits = [
    {
      hash: 'c1',
      author: 'A',
      message: 'root',
      commitDate: new Date('2020-01-01'),
      parentHashes: [] as string[],
      filesChanged: 1,
      additions: 10,
      deletions: 0,
    },
    {
      hash: 'c2',
      author: 'A',
      message: 'child',
      commitDate: new Date('2020-02-01'),
      parentHashes: ['c1'],
      filesChanged: 2,
      additions: 5,
      deletions: 1,
    },
    {
      hash: 'c3',
      author: 'B',
      message: 'merge',
      commitDate: new Date('2020-03-01'),
      parentHashes: ['c2', 'side'],
      filesChanged: 5,
      additions: 20,
      deletions: 3,
    },
    {
      hash: 'side',
      author: 'B',
      message: 'side',
      commitDate: new Date('2020-02-15'),
      parentHashes: ['c1'],
      filesChanged: 1,
      additions: 2,
      deletions: 0,
    },
  ];

  it('builds descendant counts', () => {
    const counts = buildDescendantCounts(commits);
    expect(counts.get('c1')).toBeGreaterThan(1);
  });

  it('scores merge commits higher', () => {
    const scores = calculateImpactScores(commits, new Set(['c3']));
    const merge = scores.find((s) => s.hash === 'c3');
    const child = scores.find((s) => s.hash === 'c2');
    expect(merge!.impactScore).toBeGreaterThan(child!.impactScore);
    expect(merge!.mergeParticipation).toBe(true);
  });

  it('returns top commits sorted', () => {
    const scores = calculateImpactScores(commits, new Set());
    const top = getTopImpactCommits(scores, 2);
    expect(top).toHaveLength(2);
    expect(top[0].impactScore).toBeGreaterThanOrEqual(top[1].impactScore);
  });
});

describe('parseUnifiedPatchLines', () => {
  it('parses add and remove lines', () => {
    const patch = `@@ -1,3 +1,3 @@
-old
+new
 context`;
    const lines = parseUnifiedPatchLines(patch);
    expect(lines.some((l) => l.type === 'remove')).toBe(true);
    expect(lines.some((l) => l.type === 'add')).toBe(true);
  });
});
