import { Request, Response } from 'express';
import { BranchComparisonService } from '../services/branch/branchComparisonService';
import { DiffService } from '../services/diff/diffService';
import { GitService } from '../services/git/gitService';
import { ApiResponse, BranchComparison, CommitDiff } from '../types';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const gitService = new GitService(repositoriesPath);
const comparisonService = new BranchComparisonService(gitService);
const diffService = new DiffService(gitService);

export const compareBranches = async (
  req: Request<{ id: string }, {}, {}, { sourceBranch?: string; targetBranch?: string }>,
  res: Response<ApiResponse<BranchComparison>>
): Promise<void> => {
  try {
    const { sourceBranch, targetBranch } = req.query;
    if (!sourceBranch || !targetBranch) {
      res.status(400).json({
        success: false,
        error: 'sourceBranch and targetBranch query parameters are required.',
      });
      return;
    }

    const data = await comparisonService.compare(req.params.id, sourceBranch, targetBranch);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getComparisonDiff = async (
  req: Request<{ id: string }, {}, {}, { sourceBranch?: string; targetBranch?: string }>,
  res: Response<ApiResponse<CommitDiff>>
): Promise<void> => {
  try {
    const { sourceBranch, targetBranch } = req.query;
    if (!sourceBranch || !targetBranch) {
      res.status(400).json({
        success: false,
        error: 'sourceBranch and targetBranch query parameters are required.',
      });
      return;
    }

    const comparison = await comparisonService.compare(
      req.params.id,
      sourceBranch,
      targetBranch
    );
    const range = `${comparison.mergeBase}..${sourceBranch}`;
    const diff = await diffService.getRangeDiff(req.params.id, range);
    res.status(200).json({ success: true, data: diff });
  } catch (error) {
    handleError(res, error);
  }
};

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  if (message.includes('not found')) {
    res.status(404).json({ success: false, error: message });
    return;
  }
  if (message.includes('must be different') || message.includes('required')) {
    res.status(400).json({ success: false, error: message });
    return;
  }
  if (message.includes('Local clone')) {
    res.status(422).json({ success: false, error: message });
    return;
  }
  res.status(500).json({ success: false, error: message });
}
