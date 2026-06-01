const EXCLUDED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  'target',
  '__pycache__',
  '.cache',
  'vendor',
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.min.js',
  '.min.css',
  '.map',
  '.lock',
  '.pyc',
  '.class',
  '.o',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
]);

export function shouldIncludeRepoFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').trim();
  if (!normalized || normalized.startsWith('.git/')) return false;

  const segments = normalized.split('/');
  for (const segment of segments) {
    if (EXCLUDED_SEGMENTS.has(segment)) return false;
  }

  for (const ext of EXCLUDED_EXTENSIONS) {
    if (normalized.endsWith(ext)) return false;
  }

  return true;
}

export function parseRepositoryFile(path: string): { path: string; name: string } {
  const normalized = path.replace(/\\/g, '/');
  const name = normalized.split('/').pop() ?? normalized;
  return { path: normalized, name };
}
