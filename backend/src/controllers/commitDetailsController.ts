import { Request, Response } from 'express';
import { CommitDetailsService } from '../services/commit/commitDetailsService';
import { GitService } from '../services/git/gitService';
import { ApiResponse, CommitDetails } from '../types';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const gitService = new GitService(repositoriesPath);
const commitDetailsService = new CommitDetailsService(gitService);

export const getCommitDetails = async (
  req: Request<{ hash: string }, {}, {}, { repositoryId?: string }>,
  res: Response<ApiResponse<CommitDetails>>
): Promise<void> => {
  try {
    const { hash } = req.params;
    const repositoryId = req.query.repositoryId;

    if (!repositoryId || typeof repositoryId !== 'string') {
      res.status(400).json({ success: false, error: 'repositoryId query parameter is required.' });
      return;
    }

    const details = await commitDetailsService.getCommitDetails(hash, repositoryId);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('[CommitDetailsController] getCommitDetails error:', message);

    if (message === 'Repository not found' || message === 'Commit not found') {
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
