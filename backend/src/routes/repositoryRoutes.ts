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
import {
  syncContributors,
  listContributors,
  getContributor,
  getRepositoryStats,
  getRepositoryHeatmap,
  listRepositoryFiles,
  getFileHistory,
} from '../controllers/analyticsController';
import { compareBranches, getComparisonDiff } from '../controllers/comparisonController';
import { getRepositoryPlayback } from '../controllers/playbackController';
import { getRepositoryImpact } from '../controllers/impactController';

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

router.get('/:id/compare/diff', getComparisonDiff);
router.get('/:id/compare', compareBranches);
router.get('/:id/playback', getRepositoryPlayback);
router.get('/:id/impact', getRepositoryImpact);
router.post('/:id/sync-contributors', syncContributors);
router.get('/:id/stats', getRepositoryStats);
router.get('/:id/heatmap', getRepositoryHeatmap);
router.get('/:id/files/history', getFileHistory);
router.get('/:id/files', listRepositoryFiles);
router.get('/:id/contributors/:contributorId', getContributor);
router.get('/:id/contributors', listContributors);

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
