import { Request, Response } from 'express';
import { BranchParseService } from '../services/branch/branchParseService';
import { graphService } from '../services/graph/graphServiceInstance';
import { GitService } from '../services/git/gitService';
import { ApiResponse, BranchListItem, SyncBranchesResult } from '../types';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const gitService = new GitService(repositoriesPath);
const branchParseService = new BranchParseService(gitService);
export const syncRepositoryBranches = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<SyncBranchesResult>>
): Promise<void> => {
  try {
    const result = await branchParseService.syncBranches(req.params.id);
    graphService.invalidate(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('[BranchController] syncRepositoryBranches error:', message);

    if (message === 'Repository not found') {
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

export const listRepositoryBranches = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<BranchListItem[]>>
): Promise<void> => {
  try {
    const branches = await branchParseService.listBranches(req.params.id);
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
