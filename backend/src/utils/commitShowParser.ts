export interface ParsedNumstat {
  filesChanged: number;
  additions: number;
  deletions: number;
}

/**
 * Parse `git diff-tree --numstat` or `git show --numstat` lines.
 * Format: additions\tdeletions\tfilepath (binary files use -)
 */
export function parseNumstatOutput(output: string): ParsedNumstat {
  let filesChanged = 0;
  let additions = 0;
  let deletions = 0;

  const lines = output.split('\n').filter((line) => line.trim().length > 0);

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const addStr = parts[0];
    const delStr = parts[1];

    if (addStr === '-' || delStr === '-') {
      filesChanged += 1;
      continue;
    }

    const add = Number.parseInt(addStr, 10);
    const del = Number.parseInt(delStr, 10);
    if (Number.isNaN(add) || Number.isNaN(del)) continue;

    filesChanged += 1;
    additions += add;
    deletions += del;
  }

  return { filesChanged, additions, deletions };
}
