import { Router } from 'express';
import { getCommitDetails } from '../controllers/commitDetailsController';
import { getCommitDiff } from '../controllers/diffController';

const router = Router();

/**
 * GET /commits/:hash/diff?repositoryId=
 */
router.get('/:hash/diff', getCommitDiff);

/**
 * GET /commits/:hash?repositoryId=
 * Detailed commit information including file stats from Git
 */
router.get('/:hash', getCommitDetails);

export default router;
