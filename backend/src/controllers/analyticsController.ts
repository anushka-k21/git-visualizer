import { Request, Response } from 'express';
import { ContributorAnalyticsService } from '../services/analytics/contributorAnalyticsService';
import { RepositoryStatsService } from '../services/analytics/repositoryStatsService';
import { HeatmapService } from '../services/analytics/heatmapService';
import { FileService } from '../services/file/fileService';
import { GitService } from '../services/git/gitService';
import {
  ApiResponse,
  ContributorDetail,
  ContributorListItem,
  FileHistoryResponse,
  HeatmapEntry,
  RepositoryFile,
  RepositoryStats,
  SyncContributorsResult,
} from '../types';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const gitService = new GitService(repositoriesPath);
const contributorService = new ContributorAnalyticsService();
const statsService = new RepositoryStatsService();
const heatmapService = new HeatmapService();
const fileService = new FileService(gitService);

export const syncContributors = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<SyncContributorsResult>>
): Promise<void> => {
  try {
    const result = await contributorService.syncContributors(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'syncContributors');
  }
};

export const listContributors = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<ContributorListItem[]>>
): Promise<void> => {
  try {
    const data = await contributorService.listContributors(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'listContributors');
  }
};

export const getContributor = async (
  req: Request<{ id: string; contributorId: string }>,
  res: Response<ApiResponse<ContributorDetail>>
): Promise<void> => {
  try {
    const data = await contributorService.getContributorDetail(
      req.params.id,
      req.params.contributorId
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'getContributor');
  }
};

export const getRepositoryStats = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<RepositoryStats>>
): Promise<void> => {
  try {
    const data = await statsService.getStats(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'getRepositoryStats');
  }
};

export const getRepositoryHeatmap = async (
  req: Request<{ id: string }, {}, {}, { range?: string }>,
  res: Response<ApiResponse<HeatmapEntry[]>>
): Promise<void> => {
  try {
    const data = await heatmapService.getHeatmap(req.params.id, req.query.range);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'getRepositoryHeatmap');
  }
};

export const listRepositoryFiles = async (
  req: Request<{ id: string }, {}, {}, { search?: string }>,
  res: Response<ApiResponse<RepositoryFile[]>>
): Promise<void> => {
  try {
    const data = await fileService.listFiles(req.params.id, req.query.search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'listRepositoryFiles');
  }
};

export const getFileHistory = async (
  req: Request<
    { id: string },
    {},
    {},
    { path?: string; limit?: string; skip?: string; sort?: string }
  >,
  res: Response<ApiResponse<FileHistoryResponse>>
): Promise<void> => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      res.status(400).json({ success: false, error: 'path query parameter is required.' });
      return;
    }

    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined;
    const skip = req.query.skip ? Number.parseInt(req.query.skip, 10) : undefined;
    const sort = req.query.sort === 'oldest' ? 'oldest' : 'newest';

    const data = await fileService.getFileHistory(req.params.id, filePath, {
      limit: Number.isNaN(limit) ? undefined : limit,
      skip: Number.isNaN(skip) ? undefined : skip,
      sort,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'getFileHistory');
  }
};

function handleError(res: Response, error: unknown, label: string): void {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  console.error(`[AnalyticsController] ${label} error:`, message);

  if (message === 'Repository not found' || message === 'Contributor not found') {
    res.status(404).json({ success: false, error: message });
    return;
  }
  if (message.includes('Local clone') || message === 'File path is required') {
    res.status(422).json({ success: false, error: message });
    return;
  }
  res.status(500).json({ success: false, error: message });
}
