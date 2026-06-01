import { Request, Response } from 'express';
import { DiffService } from '../services/diff/diffService';
import { GitService } from '../services/git/gitService';
import { ApiResponse, CommitDiff } from '../types';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const gitService = new GitService(repositoriesPath);
const diffService = new DiffService(gitService);

export const getCommitDiff = async (
  req: Request<{ hash: string }, {}, {}, { repositoryId?: string; path?: string }>,
  res: Response<ApiResponse<CommitDiff>>
): Promise<void> => {
  try {
    const repositoryId = req.query.repositoryId;
    if (!repositoryId || typeof repositoryId !== 'string') {
      res.status(400).json({ success: false, error: 'repositoryId query parameter is required.' });
      return;
    }

    const diff = await diffService.getCommitDiff(
      req.params.hash,
      repositoryId,
      typeof req.query.path === 'string' ? req.query.path : undefined
    );
    res.status(200).json({ success: true, data: diff });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('[DiffController] getCommitDiff error:', message);

    if (message.includes('not found')) {
      res.status(404).json({ success: false, error: message });
      return;
    }
    if (message.includes('Local clone')) {
      res.status(422).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
