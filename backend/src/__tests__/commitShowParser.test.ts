import { describe, expect, it } from 'vitest';
import { parseNumstatOutput } from '../utils/commitShowParser';

describe('parseNumstatOutput', () => {
  it('sums additions and deletions from numstat lines', () => {
    const output = ['10\t5\tfile.ts', '3\t1\tREADME.md'].join('\n');
    const result = parseNumstatOutput(output);
    expect(result.filesChanged).toBe(2);
    expect(result.additions).toBe(13);
    expect(result.deletions).toBe(6);
  });

  it('counts binary files without numeric stats', () => {
    const output = '-\t-\timage.png';
    const result = parseNumstatOutput(output);
    expect(result.filesChanged).toBe(1);
    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
  });

  it('handles empty output', () => {
    const result = parseNumstatOutput('');
    expect(result.filesChanged).toBe(0);
    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
  });
});
