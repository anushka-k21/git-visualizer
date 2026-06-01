import { Router } from 'express';
import {
  importRepository,
  listRepositories,
  getRepository,
  deleteRepository,
} from '../controllers/repositoryController';
import {
  syncRepositoryCommits,
  listRepositoryCommits,
  getRepositoryGraph,
} from '../controllers/commitController';
import {
  syncRepositoryBranches,
  listRepositoryBranches,
} from '../controllers/branchController';
import { getRepositoryTimeline } from '../controllers/timelineController';

const router = Router();

/**
 * POST /repositories/import
 * Import a new repository by URL
 */
router.post('/import', importRepository);

/**
 * GET /repositories
 * List all imported repositories
 */
router.get('/', listRepositories);

/**
 * POST /repositories/:id/sync
 * Parse and store commits from local clone
 */
router.post('/:id/sync', syncRepositoryCommits);

/**
 * GET /repositories/:id/commits
 * List stored commits for a repository
 */
router.get('/:id/commits', listRepositoryCommits);

/**
 * GET /repositories/:id/graph
 * Commit graph nodes and edges with layout positions
 */
router.get('/:id/graph', getRepositoryGraph);

/**
 * POST /repositories/:id/sync-branches
 * Refresh branch data from local clone
 */
router.post('/:id/sync-branches', syncRepositoryBranches);

/**
 * GET /repositories/:id/branches
 * List branches with commit counts
 */
router.get('/:id/branches', listRepositoryBranches);

/**
 * GET /repositories/:id/timeline?groupBy=day|week|month
 */
router.get('/:id/timeline', getRepositoryTimeline);

/**
 * GET /repositories/:id
 * Get a single repository by ID
 */
router.get('/:id', getRepository);

/**
 * DELETE /repositories/:id
 * Delete a repository
 */
router.delete('/:id', deleteRepository);

export default router;
