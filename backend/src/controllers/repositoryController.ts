import { Request, Response } from 'express';
import { RepositoryService } from '../services/repositoryService';
import { ImportRepositoryRequest, ApiResponse, Repository } from '../types';
import { isValidGitUrl } from '../utils/gitUrlParser';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
const repositoryService = new RepositoryService(repositoriesPath);

export const importRepository = async (
  req: Request<{}, {}, ImportRepositoryRequest>,
  res: Response<ApiResponse<Repository>>
): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim() === '') {
      res.status(400).json({ success: false, error: 'Repository URL is required.' });
      return;
    }

    if (!isValidGitUrl(url.trim())) {
      res.status(400).json({
        success: false,
        error: 'Invalid Git URL. Expected format: https://github.com/owner/repo',
      });
      return;
    }

    const repository = await repositoryService.importRepository({ url: url.trim() });
    res.status(201).json({
      success: true,
      data: repository,
      message: `Repository "${repository.owner}/${repository.name}" imported successfully.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('[RepositoryController] importRepository error:', message);

    if (message.includes('already imported')) {
      res.status(409).json({ success: false, error: message });
      return;
    }
    if (message.toLowerCase().includes('clone')) {
      res.status(422).json({ success: false, error: `Failed to clone: ${message}` });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};

export const listRepositories = async (
  _req: Request,
  res: Response<ApiResponse<Repository[]>>
): Promise<void> => {
  try {
    const repositories = await repositoryService.getAllRepositories();
    res.status(200).json({ success: true, data: repositories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    res.status(500).json({ success: false, error: message });
  }
};

export const getRepository = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<Repository>>
): Promise<void> => {
  try {
    const repository = await repositoryService.getRepositoryById(req.params.id);
    if (!repository) {
      res.status(404).json({ success: false, error: 'Repository not found.' });
      return;
    }
    res.status(200).json({ success: true, data: repository });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    res.status(500).json({ success: false, error: message });
  }
};

export const deleteRepository = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    await repositoryService.deleteRepository(req.params.id);
    res.status(200).json({ success: true, message: 'Repository deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
