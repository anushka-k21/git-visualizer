import { Request, Response } from 'express';
import { TimelineService } from '../services/timeline/timelineService';
import { ApiResponse, TimelineResponse } from '../types';

const timelineService = new TimelineService();

export const getRepositoryTimeline = async (
  req: Request<{ id: string }, {}, {}, { groupBy?: string }>,
  res: Response<ApiResponse<TimelineResponse>>
): Promise<void> => {
  try {
    const timeline = await timelineService.getTimeline(req.params.id, req.query.groupBy);
    res.status(200).json({ success: true, data: timeline });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
