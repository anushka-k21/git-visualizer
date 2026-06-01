import { describe, expect, it } from 'vitest';
import { isMergeCommit } from '../utils/mergeDetection';

describe('isMergeCommit', () => {
  it('returns false for root commits', () => {
    expect(isMergeCommit([])).toBe(false);
  });

  it('returns false for single-parent commits', () => {
    expect(isMergeCommit(['abc123'])).toBe(false);
  });

  it('returns true for merge commits', () => {
    expect(isMergeCommit(['p1', 'p2'])).toBe(true);
    expect(isMergeCommit(['p1', 'p2', 'p3'])).toBe(true);
  });
});
