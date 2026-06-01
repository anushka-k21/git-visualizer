export type DiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'binary';

export interface ParsedDiffFile {
  path: string;
  oldPath: string | null;
  status: DiffFileStatus;
  additions: number;
  deletions: number;
  patch: string | null;
  isBinary: boolean;
}

export interface ParsedCommitDiff {
  commitHash: string;
  author: string;
  message: string;
  commitDate: Date;
  files: ParsedDiffFile[];
}

const NUMSTAT_LINE = /^(\d+|-)\t(\d+|-)\t(.+)$/;

function detectStatusFromPatch(patch: string, path: string, oldPath: string | null): DiffFileStatus {
  if (patch.includes('Binary files ') || patch.includes('GIT binary patch')) return 'binary';
  if (patch.includes('new file mode') || patch.startsWith('--- /dev/null')) return 'added';
  if (patch.includes('deleted file mode') || patch.startsWith('+++ /dev/null')) return 'deleted';
  if (oldPath && oldPath !== path) {
    if (patch.includes('similarity index') || patch.includes('rename from')) return 'renamed';
    if (patch.includes('copy from')) return 'copied';
    return 'renamed';
  }
  return 'modified';
}

export function parseGitShowOutput(
  commitHash: string,
  header: { author: string; message: string; commitDate: Date },
  rawOutput: string
): ParsedCommitDiff {
  const files: ParsedDiffFile[] = [];
  const sections = rawOutput.split(/^diff --git /m).filter((s) => s.trim().length > 0);

  for (const section of sections) {
    const lines = section.split('\n');
    const headerLine = lines[0] ?? '';
    let path = '';
    let oldPath: string | null = null;

    const renameMatch = headerLine.match(/^a\/(.+?) b\/(.+)$/);
    const singleMatch = headerLine.match(/^a\/(.+?) b\/(.+)$/);
    if (renameMatch) {
      oldPath = renameMatch[1];
      path = renameMatch[2];
    } else {
      const parts = headerLine.split(' ');
      if (parts.length >= 2) {
        oldPath = parts[0].replace(/^a\//, '');
        path = parts[1].replace(/^b\//, '');
      } else {
        path = headerLine.replace(/^b\//, '');
      }
    }

    const patchStart = lines.findIndex((l) => l.startsWith('@@') || l.startsWith('---'));
    const patch = patchStart >= 0 ? lines.slice(patchStart).join('\n') : '';
    const isBinary = patch.includes('Binary files ') || patch.includes('GIT binary patch');

    let additions = 0;
    let deletions = 0;
    for (const line of patch.split('\n')) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions += 1;
      if (line.startsWith('-') && !line.startsWith('---')) deletions += 1;
    }

    const status = isBinary
      ? 'binary'
      : detectStatusFromPatch(patch, path, oldPath);

    files.push({
      path,
      oldPath: oldPath !== path ? oldPath : null,
      status,
      additions,
      deletions,
      patch: isBinary ? null : patch,
      isBinary,
    });
  }

  return {
    commitHash,
    author: header.author,
    message: header.message,
    commitDate: header.commitDate,
    files,
  };
}

export function parseNumstatAndPatches(
  commitHash: string,
  header: { author: string; message: string; commitDate: Date },
  numstatOutput: string,
  patchesByPath: Map<string, string>
): ParsedCommitDiff {
  const files: ParsedDiffFile[] = [];
  const lines = numstatOutput.split('\n').filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const match = line.match(NUMSTAT_LINE);
    if (!match) continue;

    const addStr = match[1];
    const delStr = match[2];
    const pathRaw = match[3].trim();
    let path = pathRaw;
    let oldPath: string | null = null;
    let status: DiffFileStatus = 'modified';

    if (pathRaw.includes(' => ')) {
      const renameParts = pathRaw.split(' => ');
      oldPath = renameParts[0].replace(/[{}]/g, '').trim();
      path = renameParts[1].replace(/[{}]/g, '').trim();
      status = 'renamed';
    }

    const isBinary = addStr === '-' && delStr === '-';
    const additions = isBinary ? 0 : Number.parseInt(addStr, 10) || 0;
    const deletions = isBinary ? 0 : Number.parseInt(delStr, 10) || 0;
    const patch = patchesByPath.get(path) ?? patchesByPath.get(pathRaw) ?? null;

    if (isBinary) {
      status = 'binary';
    } else if (patch) {
      status = detectStatusFromPatch(patch, path, oldPath);
    } else if (additions > 0 && deletions === 0 && !oldPath) {
      status = 'added';
    } else if (deletions > 0 && additions === 0) {
      status = 'deleted';
    }

    files.push({
      path,
      oldPath,
      status,
      additions,
      deletions,
      patch: isBinary ? null : patch,
      isBinary,
    });
  }

  return {
    commitHash,
    author: header.author,
    message: header.message,
    commitDate: header.commitDate,
    files,
  };
}

export function parseUnifiedPatchLines(patch: string): {
  type: 'add' | 'remove' | 'context' | 'hunk';
  content: string;
  oldLine?: number;
  newLine?: number;
}[] {
  const result: {
    type: 'add' | 'remove' | 'context' | 'hunk';
    content: string;
    oldLine?: number;
    newLine?: number;
  }[] = [];

  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) {
      result.push({ type: 'hunk', content: line });
      continue;
    }
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+')) {
      result.push({ type: 'add', content: line.slice(1) });
    } else if (line.startsWith('-')) {
      result.push({ type: 'remove', content: line.slice(1) });
    } else if (line.startsWith(' ')) {
      result.push({ type: 'context', content: line.slice(1) });
    }
  }

  return result;
}
