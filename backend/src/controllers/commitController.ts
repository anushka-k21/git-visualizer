import { Request, Response } from 'express';
import { CommitParseService } from '../services/commit/commitParseService';
import { graphService } from '../services/graph/graphServiceInstance';
import { GitService } from '../services/git/gitService';
import {
  ApiResponse,
  CommitListItem,
  GraphResponse,
  SyncResult,
} from '../types';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const gitService = new GitService(repositoriesPath);
const commitParseService = new CommitParseService(gitService);
export const syncRepositoryCommits = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<SyncResult>>
): Promise<void> => {
  try {
    const result = await commitParseService.sync(req.params.id);
    graphService.invalidate(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('[CommitController] syncRepositoryCommits error:', message);

    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    if (message.includes('clone') || message.includes('Local clone')) {
      res.status(422).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};

export const listRepositoryCommits = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<CommitListItem[]>>
): Promise<void> => {
  try {
    const commits = await commitParseService.listCommits(req.params.id);
    res.status(200).json({ success: true, data: commits });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};

export const getRepositoryGraph = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<GraphResponse>>
): Promise<void> => {
  try {
    const graph = await graphService.buildGraph(req.params.id);
    res.status(200).json({ success: true, data: graph });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
