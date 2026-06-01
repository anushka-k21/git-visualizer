import { Router } from 'express';
import { getCommitDetails } from '../controllers/commitDetailsController';

const router = Router();

/**
 * GET /commits/:hash?repositoryId=
 * Detailed commit information including file stats from Git
 */
router.get('/:hash', getCommitDetails);

export default router;
