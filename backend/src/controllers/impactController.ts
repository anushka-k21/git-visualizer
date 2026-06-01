import { Request, Response } from 'express';
import { impactAnalysisService } from '../services/impact/impactAnalysisServiceInstance';
import { ApiResponse, ImpactAnalysisResponse } from '../types';

export const getRepositoryImpact = async (
  req: Request<
    { id: string },
    {},
    {},
    {
      limit?: string;
      contributor?: string;
      branch?: string;
      minScore?: string;
      fromDate?: string;
      toDate?: string;
    }
  >,
  res: Response<ApiResponse<ImpactAnalysisResponse>>
): Promise<void> => {
  try {
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;
    const minScore = req.query.minScore
      ? Number.parseFloat(req.query.minScore)
      : undefined;

    const data = await impactAnalysisService.getImpact(req.params.id, limit, {
      contributor: req.query.contributor,
      branch: req.query.branch,
      minScore: Number.isNaN(minScore) ? undefined : minScore,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
